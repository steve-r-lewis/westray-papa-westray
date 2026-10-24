import type { PublisherAccessDecision, PublisherEventSink } from '@nuxt4-layers/publisher/contracts'
import { publisherAuthorisationPermission } from './permissions'

// Publisher's access decisions ask Authorisation. Every document belongs to the site,
// so to the platform group: a permission on it (`publisher.<type>:<action>`, see
// server/utils/permissions.ts) is held only through a role in that group, and only
// while the membership is in effect. Its only member is the platform super admin, who
// cannot sign in until editing on the site arrives (slice 1c part 2), so every change
// (create, save, publish, moderate) and every draft preview is still refused. Published
// documents need no permission to read.

export interface PublisherAccessDependencies {
  platformGroupId(): Promise<string | null>
  qualifies(input: { principalId: string, permission: string, resource: { type: string, id: string, owningGroupId: string } }): Promise<boolean>
}

export function createPublisherAccessPolicy(deps: PublisherAccessDependencies): PublisherAccessDecision {
  return {
    async allows({ identityId, permission, type, documentId }) {
      const name = publisherAuthorisationPermission(permission)
      const groupId = await deps.platformGroupId()
      if (!name || !groupId) return false
      return deps.qualifies({
        principalId: identityId,
        permission: name,
        resource: { type: name.slice(0, name.indexOf(':')), id: documentId ?? `new-${type}`, owningGroupId: groupId },
      })
    },
  }
}

// Nothing consumes Publisher's events yet (search, caches and notifications come
// later), so the relay is never run and events wait in Publisher's outbox.
export const publisherEventsUnconsumed: PublisherEventSink = {
  publish: async () => {},
}
