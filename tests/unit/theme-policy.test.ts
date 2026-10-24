import { describe, expect, it, vi } from 'vitest'
import type { ThemeAction, ThemeActorContext, ThemeResourceRef } from '@nuxt4-layers/theme-manager/contracts'
import { createThemeAccessPolicy, createThemeActor, type ThemeAccessDependencies } from '../../server/utils/theme-policy'

const anonymous: ThemeActorContext = { actorId: null, groupIds: [], organisationIds: [] }
const owner: ThemeActorContext = { actorId: 'admin', groupIds: ['group-1'], organisationIds: [] }
const subject = { principalId: 'admin', authenticatedAt: '2026-10-24T10:00:00.000Z', assurance: { level: 'aal2' as const, phishingResistant: false } }
const CHANGES: ThemeAction[] = ['theme.create', 'theme.edit', 'theme.delete', 'theme.publish', 'theme.share', 'theme.import', 'theme.export', 'theme.assign']

function theme(visibility: ThemeResourceRef['visibility'], ownership: ThemeResourceRef['ownership'] = { ownerType: 'user', ownerId: 'admin' }): ThemeResourceRef {
  return { resourceType: 'theme', resourceId: 'westray-spring', ownership, visibility }
}

function policy(allowed: boolean, overrides: Partial<ThemeAccessDependencies> = {}) {
  const deps = {
    subject: vi.fn(async () => subject),
    owningGroupId: vi.fn(async () => 'personal-group'),
    authorise: vi.fn(async () => ({ allowed })),
    ...overrides,
  }
  return { deps, policy: createThemeAccessPolicy(deps) }
}

describe('theme actor', () => {
  it('is anonymous until someone signs in', async () => {
    const actor = createThemeActor({ principal: async () => null, groupIds: async () => ['never'] })
    expect(await actor.getActorContext()).toEqual(anonymous)
  })

  it('is the signed-in person, with the groups they are in', async () => {
    const actor = createThemeActor({ principal: async () => ({ principalId: 'admin' }), groupIds: async () => ['group-1'] })
    expect(await actor.getActorContext()).toEqual(owner)
  })
})

describe('theme access policy', () => {
  it('lets anyone read and use public and system themes, without asking Authorisation', async () => {
    const { deps, policy: themes } = policy(false)
    for (const action of ['theme.read', 'theme.use'] as const) {
      expect(await themes.isAllowed({ actor: anonymous, action, resource: theme('public') })).toBe(true)
      expect(await themes.isAllowed({ actor: anonymous, action, resource: theme('system') })).toBe(true)
    }
    expect(deps.authorise).not.toHaveBeenCalled()
  })

  it('keeps private, group and shared themes from anyone but their owner', async () => {
    const { policy: themes } = policy(false)
    for (const visibility of ['private', 'group', 'organisation', 'shared'] as const) {
      expect(await themes.isAllowed({ actor: anonymous, action: 'theme.read', resource: theme(visibility) })).toBe(false)
      expect(await themes.isAllowed({ actor: owner, action: 'theme.read', resource: theme(visibility) })).toBe(true)
    }
    expect(await themes.isAllowed({ actor: owner, action: 'theme.use', resource: theme('group', { ownerType: 'group', ownerId: 'group-1' }) })).toBe(true)
  })

  it('asks Authorisation for every change, on the group that owns the theme', async () => {
    const { deps, policy: themes } = policy(true)
    expect(await themes.isAllowed({ actor: owner, action: 'theme.edit', resource: theme('public') })).toBe(true)
    expect(deps.owningGroupId).toHaveBeenCalledWith({ ownerType: 'user', ownerId: 'admin' })
    expect(deps.authorise).toHaveBeenCalledWith({
      subject,
      permission: 'themes:edit',
      resource: { type: 'themes', id: 'westray-spring', owningGroupId: 'personal-group' },
    })
  })

  it('refuses every change that no role grants, even to an owner', async () => {
    const { policy: themes } = policy(false)
    for (const action of CHANGES) {
      expect(await themes.isAllowed({ actor: owner, action, resource: theme('public') }), action).toBe(false)
    }
  })

  it('refuses every change to someone signed out, without asking', async () => {
    const { deps, policy: themes } = policy(true, { subject: vi.fn(async () => null) })
    for (const action of CHANGES) {
      expect(await themes.isAllowed({ actor: anonymous, action, resource: theme('public') }), action).toBe(false)
    }
    expect(deps.authorise).not.toHaveBeenCalled()
  })

  it('fails closed when Authorisation or Identity cannot answer', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failing = policy(true, { authorise: vi.fn(async () => { throw new Error('down') }) })
    expect(await failing.policy.isAllowed({ actor: owner, action: 'theme.edit', resource: theme('public') })).toBe(false)
    const noGroup = policy(true, { owningGroupId: vi.fn(async () => null) })
    expect(await noGroup.policy.isAllowed({ actor: owner, action: 'theme.edit', resource: theme('public') })).toBe(false)
    error.mockRestore()
  })
})
