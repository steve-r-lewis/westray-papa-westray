import type { H3Event } from 'h3'
import {
  createAuthenticationEventHandler,
  createDisposalConfirmationHandler,
  createIdentityEventHandler,
  createProfileEventHandler,
  type MemberEventLike,
} from '@nuxt4-layers/iam-integration/adapters'
import { ensureRuntimeRole, runtimeRole } from '../database/runtime-role'

// The IAM suite as the site composes it (server/plugins/iam.ts): what has to happen
// before Identity serves anything, and the work the suite's members leave to their
// host, its outbox relays and maintenance, run by server/tasks/iam/.

let preparing: Promise<Platform | null> | null = null

/**
 * Creates the runtime role, applies Identity's and Profile's migrations as the owner,
 * and gives Identity the platform's tenant and group from `pnpm db:seed`. Once per
 * process; everything that needs Identity waits for it. A failure is tried again on
 * the next call.
 */
export function prepareIam(): Promise<Platform | null> {
  preparing ??= (async () => {
    const sql = useDatabase()
    const owner = useDatabasePool()
    const runtimeUrl = process.env.DATABASE_RUNTIME_URL
    if (!sql || !owner || !runtimeUrl) return null
    const role = runtimeRole(runtimeUrl, process.env.DATABASE_URL!)
    await ensureRuntimeRole(sql, role)
    await migrateIdentityDatabase({ pool: owner, runtimeRole: role.name })
    await migrateProfileDatabase()
    const platform = await readPlatform()
    if (!platform) console.error('[iam] The platform is not provisioned: run `pnpm db:seed`, then restart. Sign-up is refused until then.')
    provideIdentityPolicy({ defaultHomeTenantId: platform?.tenantId ?? null, platformGroupId: platform?.platformGroupId ?? null })
    if (platform) provideConfigurationPlatformGroup(platform.platformGroupId)
    return platform
  })().catch((error: unknown) => {
    preparing = null
    throw error
  })
  return preparing
}

/** Authentication's principal for a request, for the members' subject resolvers. */
export const principalOf = (event: unknown) => getAuthenticatedPrincipal(event as H3Event)

const disposalConfirmations = createDisposalConfirmationHandler({ record: input => recordIdentityDisposal(input) })

/** What the other members do when Identity announces a change. */
export const handleIdentityEvent = createIdentityEventHandler({
  revokeSessions: principalId => revokeAuthenticationSessions(principalId),
  discardAccount: principalId => discardAuthenticationAccount(principalId),
  deleteAccount: principalId => deleteAuthenticationAccount(principalId),
  assignRole: input => assignAuthorisationRole(input),
  unassignRole: input => unassignAuthorisationRole(input),
  defaultRoles: groupId => authorisationDefaultRoles(groupId),
  erasePrincipal: input => eraseAuthorisationPrincipal(input),
  applyProfileEvent: event => applyProfileIdentityEvent(event as Parameters<typeof applyProfileIdentityEvent>[0]),
  heldParts: identityId => profileLegalHoldParts(identityId),
  recordRequestPart: input => recordProfileRequestPart(input),
  disposeGroup: input => disposeAuthorisationGroup(input),
  disposeTenant: input => disposeAuthorisationTenant(input),
})

const handleProfileEvent = createProfileEventHandler({
  deleteAccount: principalId => deleteAuthenticationAccount(principalId),
  erasePrincipal: input => eraseAuthorisationPrincipal(input),
  recordRequestPart: input => recordProfileRequestPart(input),
})

/** Authentication's events: a credential recovery starts Identity's recovery hold. */
export const handleAuthenticationEvent = createAuthenticationEventHandler({ record: input => recordIdentityCredentialRecovery(input) })

/** Delivers every member's waiting events, in order. Safe to run at any time, and again. */
export async function relayIam() {
  await prepareIam()
  const identity = await relayIdentityOutbox({ limit: 200 })
  const authorisation = await relayAuthorisationOutbox({ limit: 200, publish: event => disposalConfirmations(event as unknown as MemberEventLike) })
  const profile = await relayProfileOutbox({
    limit: 200,
    publish: async (event) => {
      await handleProfileEvent(event as unknown as Parameters<typeof handleProfileEvent>[0])
      await disposalConfirmations(event as unknown as MemberEventLike)
    },
  })
  return { identity, authorisation, profile }
}

/** Each member's maintenance: expiries, delays, holds and retention. Safe to run again. */
export async function maintainIam() {
  await prepareIam()
  return {
    identity: await runIdentityMaintenance(),
    authentication: await runAuthenticationMaintenance(),
    authorisation: await runAuthorisationMaintenance(),
    profile: await runProfileMaintenance(),
  }
}

/** Profile's master keys from PROFILE_KEYS (`version=key,...`) and PROFILE_KEY_VERSION. */
export function profileKeys(env: Readonly<Record<string, string | undefined>> = process.env): { keys: Record<string, string>, current: string } {
  const keys: Record<string, string> = {}
  for (const pair of (env.PROFILE_KEYS ?? '').split(',').map(entry => entry.trim()).filter(Boolean)) {
    const at = pair.indexOf('=')
    if (at < 1) throw new TypeError('PROFILE_KEYS holds version=key pairs, separated by commas.')
    keys[pair.slice(0, at)] = pair.slice(at + 1)
  }
  const current = env.PROFILE_KEY_VERSION?.trim() ?? ''
  if (!current || !keys[current]) throw new TypeError('PROFILE_KEY_VERSION must name one of the versions in PROFILE_KEYS.')
  return { keys, current }
}
