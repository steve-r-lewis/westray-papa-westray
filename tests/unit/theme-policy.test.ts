import { describe, expect, it } from 'vitest'
import type { ThemeAction, ThemeActorContext, ThemeResourceRef } from '@nuxt4-layers/theme-manager/contracts'
import { anonymousThemeActor, themeAccessPolicy } from '../../server/utils/theme-policy'

const anonymous: ThemeActorContext = { actorId: null, groupIds: [], organisationIds: [] }
const owner: ThemeActorContext = { actorId: 'admin', groupIds: [], organisationIds: [] }

function theme(visibility: ThemeResourceRef['visibility']): ThemeResourceRef {
  return { resourceType: 'theme', resourceId: 'westray-spring', ownership: { ownerType: 'user', ownerId: 'admin' }, visibility }
}

const allowed = (actor: ThemeActorContext, action: ThemeAction, resource: ThemeResourceRef) =>
  themeAccessPolicy.isAllowed({ actor, action, resource })

describe('theme access policy until Authorisation is composed', () => {
  it('treats every request as anonymous', async () => {
    expect(await anonymousThemeActor.getActorContext()).toEqual(anonymous)
  })

  it('lets anyone read and use public and system themes', async () => {
    for (const action of ['theme.read', 'theme.use'] as const) {
      expect(await allowed(anonymous, action, theme('public'))).toBe(true)
      expect(await allowed(anonymous, action, theme('system'))).toBe(true)
    }
  })

  it('keeps private, group and shared themes from anyone but their owner', async () => {
    for (const visibility of ['private', 'group', 'organisation', 'shared'] as const) {
      expect(await allowed(anonymous, 'theme.read', theme(visibility))).toBe(false)
      expect(await allowed(owner, 'theme.read', theme(visibility))).toBe(true)
    }
  })

  it('refuses every change, even to an owner', async () => {
    const changes: ThemeAction[] = ['theme.create', 'theme.edit', 'theme.delete', 'theme.publish', 'theme.share', 'theme.import', 'theme.export', 'theme.assign']
    for (const action of changes) {
      expect(await allowed(owner, action, theme('public'))).toBe(false)
    }
  })
})
