import { randomBytes } from 'node:crypto'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { readContentFiles } from '../../server/database/content-files'
import { Browser, root, signUpMember, testSite } from './support'

// Accounts, through the built site: a person signs up, confirms their address, signs in
// with a second step and fills in their profile. Then no signed-out request, to any
// account page or any IAM layer's API, shows anything of theirs: not their address,
// name or identifiers, whether it never signed in or has just signed out. And signing
// in grants nothing: a member with no roles changes no theme, setting or document.
//
// Needs DATABASE_URL, as a role that may create databases; skipped without it.

const url = process.env.DATABASE_URL

let site: Awaited<ReturnType<typeof testSite>>
if (url) {
  site = await testSite('accounts', await readContentFiles(`${root}data/content`))
  await setup({
    rootDir: root,
    server: true,
    build: true,
    setupTimeout: 600_000,
    port: site.port,
    env: site.env,
  })
}

const marker = randomBytes(4).toString('hex')
const email = `personal.${marker}@example.org`
const password = `a passphrase nobody else has ${marker}`
const name = `Personal Person ${marker}`

interface Member {
  browser: Browser
  personal: string[]
}

let member: Promise<Member> | undefined
// Signed up once, with a profile: what must never reach anyone signed out.
function signedUp(): Promise<Member> {
  member ??= (async () => {
    const { browser, principalId } = await signUpMember(site, email, password)
    const own = await browser.json<{ version: number }>('/api/profile/me')
    await browser.json('/api/profile/me', { method: 'PATCH', body: { expectedVersion: own.version, changes: { name, phone_number: '+447700900456' } } })
    const me = await browser.json<{ actor: { personalGroup: { groupId: string } } }>('/api/identity/me')
    return { browser, personal: [email, encodeURIComponent(email), name, '7700900456', principalId, me.actor.personalGroup.groupId] }
  })()
  return member
}

const PAGES = ['/account', '/account/profile', '/account/security', '/account/second-factor']

function apis(personal: string[]) {
  const [, , , , principalId, groupId] = personal
  return [
    '/api/authentication/session', '/api/authentication/sessions', '/api/authentication/mfa', '/api/authentication/federation/accounts',
    '/api/identity/me', `/api/identity/groups/${groupId}`, `/api/identity/groups/${groupId}/members`, `/api/identity/groups/${groupId}/invitations`,
    `/api/identity/groups/${groupId}/changes`, `/api/identity/service-identities/${principalId}`,
    '/api/profile/me', '/api/profile/me/export', '/api/profile/me/departures', '/api/profile/me/requests', `/api/profile/people/${principalId}`,
    '/api/authorisation/me', `/api/authorisation/groups/${groupId}/access`, `/api/authorisation/groups/${groupId}/assignments`,
    `/api/authorisation/groups/${groupId}/grants`, '/api/authorisation/visible-groups?permission=identity.groups:view',
    '/api/configuration', '/api/configuration/admin', '/api/configuration/history',
  ]
}

// Answers that carry no one's data at all, signed in or not.
const PUBLIC = new Set(['/api/authentication/session', '/api/configuration'])

async function expectNothingPersonal(reader: Browser | null, personal: string[]) {
  for (const path of [...PAGES, ...apis(personal)]) {
    for (const accept of ['text/html', 'application/json']) {
      const response = reader ? await reader.request(path, { accept }) : await fetch(path, { redirect: 'manual', headers: { accept } })
      // An error page echoes the address asked for, which is the one thing that may name
      // an identifier: the asker supplied it.
      const body = (await response.text()).replaceAll(path, '{path}').replaceAll(path.replaceAll('/', '\\u002F'), '{path}')
      const headers = [...response.headers].map(([key, value]) => `${key}: ${value}`).join('\n')
      for (const value of personal) {
        expect(body, `${accept} ${path} shows ${value}`).not.toContain(value)
        expect(headers, `${accept} ${path} has ${value} in its headers`).not.toContain(value)
      }
      if (PAGES.includes(path)) {
        // Every account page sends a signed-out visitor to sign in.
        expect(response.status, path).toBe(302)
        expect(response.headers.get('location'), path).toMatch(/^\/sign-in\?redirect=/)
      }
      else if (!PUBLIC.has(path)) {
        expect(response.status, `${accept} ${path}`).toBeGreaterThanOrEqual(400)
      }
    }
  }
  const session = await (reader ? reader.request('/api/authentication/session') : fetch('/api/authentication/session'))
  expect((await session.json()).principal).toBeNull()
}

describe.skipIf(!url)('accounts', () => {
  it('lets a person sign up, sign in with a second step, and see and change their own profile', async () => {
    const { browser } = await signedUp()
    const profile = await browser.request('/account/profile', { accept: 'text/html' })
    expect(profile.status).toBe(200)
    const html = await profile.text()
    expect(html).toContain(name)
    expect(html).toContain('id="site-menu"')
    for (const path of ['/account', '/account/security']) {
      expect((await browser.request(path, { accept: 'text/html' })).status, path).toBe(200)
    }
    // Already signed in, so sign-in sends them on.
    expect((await browser.request('/sign-in', { accept: 'text/html' })).headers.get('location')).toBe('/account')
  })

  it('shows nothing personal to a request that never signed in', async () => {
    const { personal } = await signedUp()
    await expectNothingPersonal(null, personal)
  })

  it('shows nothing personal once the member has signed out', async () => {
    const { personal } = await signedUp()
    // A second browser, signed in and then out, keeps whatever cookies it was left with.
    const browser = new Browser(site.origin)
    expect((await browser.json<{ status: string }>('/api/authentication/sign-in', { method: 'POST', body: { email, password } })).status).toBe('second-factor-required')
    await browser.json('/api/authentication/sign-out', { method: 'POST' })
    await expectNothingPersonal(browser, personal)
  })

  it('grants a member with no roles nothing: no theme, setting or document changes', async () => {
    const { browser } = await signedUp()
    const theme = await (await browser.request('/api/themes/westray-spring')).text()
    if (theme.includes('"id"')) {
      expect((await browser.request('/api/themes/westray-spring', { method: 'PUT', body: JSON.parse(theme) })).status).toBe(403)
      expect((await browser.request('/api/themes/westray-spring', { method: 'DELETE' })).status).toBe(403)
    }
    const created = await browser.request('/api/themes', { method: 'POST', body: { id: 'members-own', name: 'Mine' } })
    expect(created.status).toBeGreaterThanOrEqual(400)
    expect((await browser.request('/api/configuration/admin?scope=platform')).status).toBeGreaterThanOrEqual(400)
    // Publisher's own API stays off: nothing edits on the site until part 2.
    expect((await browser.request('/api/publisher/admin/documents?type=page')).status).toBe(404)
    // A child group of their personal group, which a member's wildcard roles might reach.
    const { actor } = await browser.json<{ actor: { personalGroup: { groupId: string } } }>('/api/identity/me')
    expect((await browser.request('/api/identity/groups', { method: 'POST', body: { parentGroupId: actor.personalGroup.groupId, name: 'A club' } })).status).toBeGreaterThanOrEqual(400)
  })
})
