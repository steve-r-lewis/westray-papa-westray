import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { AUTHENTICATION_MESSAGE_KINDS } from '@nuxt4-layers/authentication/contracts'
import { DEFAULT_AUTHORISATION_POLICY } from '@nuxt4-layers/authorisation/contracts'
import { rolesWithIdentityPermissions } from '@nuxt4-layers/iam-integration/adapters'
import { IDENTITY_PERMISSIONS } from '@nuxt4-layers/identity/contracts'
import { PROFILE_PERMISSIONS } from '@nuxt4-layers/profile/contracts'
import shellData from '../../data/shell.json'
import { runtimeRole } from '../../server/database/runtime-role'
import { authenticationMail, createAuthenticationMailer, createProfileNotifier, mailTransport } from '../../server/utils/mail'
import {
  PUBLISHER_AUTHORISATION_PERMISSIONS,
  publisherAuthorisationPermission,
  THEME_AUTHORISATION_PERMISSIONS,
  WESTRAY_PERMISSIONS,
} from '../../server/utils/permissions'
import { createPublisherAccessPolicy } from '../../server/utils/publisher-access'
import { shellSchema } from '../../shared/shell'

const shell = shellSchema.parse(shellData)
const OWNER = 'postgres://owner:secret@localhost:5432/site'

describe('permission catalogue', () => {
  it('names every permission in Authorisation\'s grammar, once', () => {
    const names = WESTRAY_PERMISSIONS.map(permission => permission.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) expect(name, name).toMatch(/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*:[a-z][a-z0-9_]*$/)
  })

  it('maps Publisher\'s permissions, and nothing else', () => {
    expect(publisherAuthorisationPermission('publisher.blog-post.view-draft')).toBe('publisher.blog-post:view_draft')
    expect(publisherAuthorisationPermission('publisher.page.edit')).toBe('publisher.page:edit')
    expect(publisherAuthorisationPermission('publisher.page.delete')).toBeNull()
    expect(publisherAuthorisationPermission('themes:edit')).toBeNull()
    expect(PUBLISHER_AUTHORISATION_PERMISSIONS.map(permission => permission.name)).toContain('publisher.members-notice:publish')
  })

  // A wildcard never reaches a high or critical permission: only a role naming one grants it.
  it('keeps every theme change out of every role', () => {
    const roles = rolesWithIdentityPermissions({ permissions: [...IDENTITY_PERMISSIONS, ...PROFILE_PERMISSIONS], roles: DEFAULT_AUTHORISATION_POLICY.roles })
    const named = new Set([...roles.owner, ...roles.administrator, ...DEFAULT_AUTHORISATION_POLICY.roles.member, ...DEFAULT_AUTHORISATION_POLICY.roles.viewer].map(entry => entry.pattern))
    for (const permission of THEME_AUTHORISATION_PERMISSIONS) {
      expect(permission.risk).toBe('high')
      expect(named.has(permission.name)).toBe(false)
    }
    expect(named.has('configuration.platform-settings:manage')).toBe(false)
  })
})

describe('Publisher\'s access decisions', () => {
  const allowsInput = { identityId: 'member', permission: 'publisher.article.edit', siteId: 'westray', type: 'article', documentId: 'doc-1', consistency: 'strong' as const }

  it('ask Authorisation about the platform group, which owns every document', async () => {
    const qualifies = vi.fn(async () => true)
    const policy = createPublisherAccessPolicy({ platformGroupId: async () => 'platform', qualifies })
    expect(await policy.allows(allowsInput)).toBe(true)
    expect(qualifies).toHaveBeenCalledWith({
      principalId: 'member',
      permission: 'publisher.article:edit',
      resource: { type: 'publisher.article', id: 'doc-1', owningGroupId: 'platform' },
    })
  })

  it('refuse when no role grants the permission', async () => {
    const policy = createPublisherAccessPolicy({ platformGroupId: async () => 'platform', qualifies: async () => false })
    expect(await policy.allows(allowsInput)).toBe(false)
  })

  it('refuse without asking before the platform is provisioned, or for a permission Authorisation does not know', async () => {
    const qualifies = vi.fn(async () => true)
    expect(await createPublisherAccessPolicy({ platformGroupId: async () => null, qualifies }).allows(allowsInput)).toBe(false)
    expect(await createPublisherAccessPolicy({ platformGroupId: async () => 'platform', qualifies }).allows({ ...allowsInput, permission: 'publisher.article.delete' })).toBe(false)
    expect(qualifies).not.toHaveBeenCalled()
  })
})

describe('runtime role', () => {
  it('is DATABASE_RUNTIME_URL\'s role, on the same database', () => {
    expect(runtimeRole('postgres://site_runtime:p%40ss@localhost:5432/site', OWNER)).toEqual({ name: 'site_runtime', password: 'p@ss' })
  })

  it('must be a role of its own, with a password', () => {
    expect(() => runtimeRole('postgres://owner:secret@localhost:5432/site', OWNER)).toThrow(/role of its own/)
    expect(() => runtimeRole('postgres://site_runtime@localhost:5432/site', OWNER)).toThrow(/password/)
    expect(() => runtimeRole('postgres://site_runtime:p@localhost:5432/other', OWNER)).toThrow(/same database/)
  })
})

describe('mail', () => {
  it('words every Authentication message from the shell, with its link and expiry', () => {
    for (const kind of AUTHENTICATION_MESSAGE_KINDS) {
      const mail = authenticationMail({ kind, to: 'someone@example.org', locale: 'en-GB', actionUrl: 'https://example.org/act?token=t', expiresAt: '2026-10-24T12:30:00.000Z', eventType: null }, shell.mail)
      expect(mail.subject).toBe(shell.mail.messages[kind].subject)
      expect(mail.text).toContain(shell.mail.messages[kind].body)
      expect(mail.text).toContain('https://example.org/act?token=t')
      expect(mail.text).toContain('24 Oct 2026, 13:30')
    }
  })

  it('writes each message to a file of its own in directory mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'wpw-mail-'))
    try {
      const mailer = createAuthenticationMailer({ transport: () => mailTransport({ MAIL_TRANSPORT: 'directory', MAIL_DIRECTORY: directory }), mail: async () => shell.mail })
      await mailer.send({ kind: 'password-reset', to: 'someone@example.org', locale: 'en-GB', actionUrl: 'https://example.org/reset?token=t', expiresAt: null, eventType: null })
      const notifier = createProfileNotifier({ transport: () => mailTransport({ MAIL_TRANSPORT: 'directory', MAIL_DIRECTORY: directory }), mail: async () => shell.mail })
      await notifier.send({ channel: 'email', to: 'someone@example.org', purpose: 'contact-verification', attribute: 'email', code: '123456', locale: null, expiresInSeconds: 600 })
      const files = await readdir(directory)
      expect(files).toHaveLength(2)
      const messages = await Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8'))))
      expect(messages.map(message => message.kind).sort()).toEqual(['contact-verification', 'password-reset'])
      expect(messages.find(message => message.kind === 'contact-verification').text).toContain('123456')
      await expect(notifier.send({ channel: 'sms', to: '+447700900123', purpose: 'contact-verification', attribute: 'phone_number', code: '1', locale: null, expiresInSeconds: 60 })).rejects.toThrow()
    }
    finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('refuses to send without a transport, and needs SMTP\'s settings for SMTP', async () => {
    await expect(mailTransport({}).send({ kind: 'x', to: 'a@example.org', subject: 's', text: 't' })).rejects.toThrow(/MAIL_TRANSPORT/)
    expect(() => mailTransport({ MAIL_TRANSPORT: 'smtp' })).toThrow(/SMTP_URL/)
    expect(() => mailTransport({ MAIL_TRANSPORT: 'directory' })).toThrow(/MAIL_DIRECTORY/)
  })
})
