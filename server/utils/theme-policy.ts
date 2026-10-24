import type {
  ThemeActorContext,
  ThemeActorContextProvider,
  ThemeAuthorizationService,
  ThemeResourceRef,
} from '@nuxt4-layers/theme-manager/contracts'

// Who is acting, for Theme Manager. Nobody can sign in until Authentication and
// Identity arrive in slice 1c, so every request is anonymous for now.
export const anonymousThemeActor: ThemeActorContextProvider = {
  getActorContext: async () => ({ actorId: null, groupIds: [], organisationIds: [] }),
}

function owns(actor: ThemeActorContext, resource: ThemeResourceRef): boolean {
  const owner = resource.ownership
  if (!owner?.ownerId) return false
  if (owner.ownerType === 'user') return actor.actorId === owner.ownerId
  if (owner.ownerType === 'group') return actor.groupIds.includes(owner.ownerId)
  if (owner.ownerType === 'organisation') return actor.organisationIds.includes(owner.ownerId)
  return false
}

// Theme decisions until Authorisation is composed in slice 1c: anyone may see and
// use public and system themes, owners may see and use their own, and every change
// (create, edit, delete, publish, share, import, export, assign) is refused.
export const themeAccessPolicy: ThemeAuthorizationService = {
  async isAllowed({ actor, action, resource }) {
    if (action !== 'theme.read' && action !== 'theme.use') return false
    return resource.visibility === 'public' || resource.visibility === 'system' || owns(actor, resource)
  },
}
