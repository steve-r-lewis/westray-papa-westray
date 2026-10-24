import { useEvent } from 'nitropack/runtime'

// Connects Theme Manager's ports: storage on PostgreSQL, the signed-in person as its
// actor, and the access policy in server/utils/theme-policy.ts, which asks
// Authorisation about every change. Without DATABASE_URL Theme Manager runs on its
// built-in default theme.

/** The request being served, or null outside one. */
function currentEvent() {
  try {
    return useEvent()
  }
  catch {
    return null
  }
}

async function principal() {
  const event = currentEvent()
  return event ? principalOf(event) : null
}

export default defineNitroPlugin(() => {
  provideThemeActorContext(createThemeActor({
    principal,
    groupIds: async (principalId) => {
      const actor = await getIdentityDirectory().resolveActor(principalId, { consistency: 'bounded' })
      return actor?.memberships.map(membership => membership.group.groupId) ?? []
    },
  }))
  provideThemeAuthorization(createThemeAccessPolicy({
    subject: principal,
    // A person's theme belongs to their personal group, a group's to the group, and
    // any other, the site's own, to the platform group.
    owningGroupId: async (ownership) => {
      if (ownership?.ownerType === 'user' && ownership.ownerId) {
        const actor = await getIdentityDirectory().resolveActor(ownership.ownerId, { consistency: 'bounded' })
        return actor?.personalGroup?.groupId ?? null
      }
      if (ownership?.ownerType === 'group' && ownership.ownerId) return ownership.ownerId
      return (await readPlatform())?.platformGroupId ?? null
    },
    authorise,
  }))

  const sql = useDatabase()
  if (sql) {
    const store = createThemeStore(sql)
    provideThemeRepository({ getThemeRepository: () => store })
  }
})
