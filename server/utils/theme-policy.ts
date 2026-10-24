import type {
  ThemeActorContext,
  ThemeActorContextProvider,
  ThemeAuthorizationService,
  ThemeOwnership,
  ThemeResourceRef,
} from '@nuxt4-layers/theme-manager/contracts'
import { isThemeChange, themeAuthorisationPermission } from './permissions'

// Theme Manager's actor and access policy. Anyone may see and use public and system
// themes, and members of a theme's owner may see and use theme kept to it; that is
// decided by visibility here, without asking anyone. Every change (create, edit,
// delete, publish, share, import, export, assign) asks Authorisation for
// `themes:<action>` on the group that owns the theme. Those permissions are `high`, so
// only a role naming them grants them, and no role does yet: every change is refused
// until group administration gives themes a home (slice 2).

/** Who is signed in, as Authorisation's subject, and the groups they are in now. */
export interface ThemeActorDependencies {
  principal(): Promise<{ principalId: string } | null>
  groupIds(principalId: string): Promise<readonly string[]>
}

export function createThemeActor(deps: ThemeActorDependencies): ThemeActorContextProvider {
  return {
    async getActorContext() {
      const principal = await deps.principal()
      if (!principal) return { actorId: null, groupIds: [], organisationIds: [] }
      return { actorId: principal.principalId, groupIds: [...await deps.groupIds(principal.principalId)], organisationIds: [] }
    },
  }
}

export interface ThemeAccessDependencies {
  /** The signed-in subject, with its assurance, or null. */
  subject(): Promise<{ principalId: string, authenticatedAt: string, assurance: { level: 'aal1' | 'aal2', phishingResistant: boolean } } | null>
  /** The group that owns a theme: a person's personal group, a group, or the platform group. */
  owningGroupId(ownership: ThemeOwnership | undefined): Promise<string | null>
  authorise(input: {
    subject: { principalId: string, authenticatedAt: string, assurance: { level: 'aal1' | 'aal2', phishingResistant: boolean } }
    permission: string
    resource: { type: string, id: string, owningGroupId: string }
  }): Promise<{ allowed: boolean }>
}

function owns(actor: ThemeActorContext, resource: ThemeResourceRef): boolean {
  const owner = resource.ownership
  if (!owner?.ownerId) return false
  if (owner.ownerType === 'user') return actor.actorId === owner.ownerId
  if (owner.ownerType === 'group') return actor.groupIds.includes(owner.ownerId)
  if (owner.ownerType === 'organisation') return actor.organisationIds.includes(owner.ownerId)
  return false
}

export function createThemeAccessPolicy(deps: ThemeAccessDependencies): ThemeAuthorizationService {
  return {
    async isAllowed({ actor, action, resource }) {
      if (action === 'theme.read' || action === 'theme.use') {
        return resource.visibility === 'public' || resource.visibility === 'system' || owns(actor, resource)
      }
      if (!isThemeChange(action) || !actor.actorId) return false
      try {
        const subject = await deps.subject()
        if (!subject || subject.principalId !== actor.actorId) return false
        const groupId = await deps.owningGroupId(resource.ownership)
        if (!groupId) return false
        const decision = await deps.authorise({
          subject,
          permission: themeAuthorisationPermission(action),
          resource: { type: 'themes', id: resource.resourceId, owningGroupId: groupId },
        })
        return decision.allowed
      }
      catch (error) {
        // Fails closed: a member that cannot answer refuses the change.
        console.error('[themes] access decision failed:', error instanceof Error ? error.message : error)
        return false
      }
    },
  }
}
