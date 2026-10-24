import { DEFAULT_AUTHORISATION_POLICY } from '@nuxt4-layers/authorisation/contracts'
import { IDENTITY_PERMISSIONS } from '@nuxt4-layers/identity/contracts'
import {
  authenticationIdentityFromIdentity,
  authorisationDirectoryFromIdentity,
  authorisationGovernanceFromIdentity,
  identityAccessDecisionFromAuthorisation,
  identityApprovalPolicyFromAuthorisation,
  identitySubjectResolverFromAuthentication,
  legalHoldsFromMembers,
  profileAccessDecisionFromAuthorisation,
  profileRequestCoordinatorFromMembers,
  rolesWithIdentityPermissions,
} from '@nuxt4-layers/iam-integration/adapters'
import { PROFILE_PERMISSIONS } from '@nuxt4-layers/profile/contracts'
import { runtimeRole } from '../database/runtime-role'

// Composes the IAM suite: Authentication (who has signed in), Identity (which identity,
// in which groups), Profile (what a person says about themselves) and Authorisation
// (who may do what), joined by iam-integration's reference adapters. Each member keeps
// its own schema: Authentication and Authorisation on DATABASE_URL's pool, Identity and
// Profile on the runtime role's (DATABASE_RUNTIME_URL), which owns nothing and cannot
// bypass their row-level security. Their own pages are not registered: the site draws
// every screen (app/pages/sign-in.vue, app/pages/account/).
export default defineNitroPlugin(() => {
  const owner = useDatabasePool()
  const runtime = useRuntimeDatabasePool()
  const subjects = identitySubjectResolverFromAuthentication({ getAuthenticatedPrincipal: principalOf })
  const mail = { transport: () => mailTransport(), mail: async () => (await readShell()).mail }

  // Identity's ports are read when used, after prepareIam() has given it the platform.
  const provisioning = authenticationIdentityFromIdentity({
    provisioning: {
      reserve: async input => (await prepareIam(), getIdentityProvisioning().reserve(input)),
      confirm: async (input) => {
        await prepareIam()
        const provisioned = await getIdentityProvisioning().confirm(input)
        // Profile keeps a record from `identity.provisioned`: deliver it now, not at the next run.
        await relayIam().catch(error => console.error('[iam] relay after confirmation failed:', error instanceof Error ? error.message : error))
        return provisioned
      },
      signInStatus: async identityId => (await prepareIam(), getIdentityProvisioning().signInStatus(identityId)),
    },
  })

  // Authentication
  provideAuthenticationMailer(createAuthenticationMailer(mail))
  provideAuthenticationIdentity(provisioning)
  provideAuthenticationEventSink({ emit: event => handleAuthenticationEvent(event) })
  provideAuthenticationLegalHolds(legalHoldsFromMembers({ part: 'authentication', groupOrTenantHeld: identityLegalHoldCovers, personHeldParts: profileLegalHoldParts }))

  // Identity
  provideIdentityAccessDecision(identityAccessDecisionFromAuthorisation({ authorise }))
  provideIdentityApprovalPolicy(identityApprovalPolicyFromAuthorisation({
    riskOf: westrayPermissionRisk,
    qualifies: authorisationQualifies,
    countQualifying: countAuthorisationQualifying,
  }))
  provideIdentityEventPublisher({ publish: event => handleIdentityEvent(event) })
  provideIdentitySubjectResolver(subjects)
  provideIdentityPolicy({})

  // Authorisation
  provideAuthorisationDirectory(authorisationDirectoryFromIdentity({
    directory: {
      resolveActor: async (identityId, options) => (await prepareIam(), getIdentityDirectory().resolveActor(identityId, options)),
      describeGroup: async (groupId, options) => (await prepareIam(), getIdentityDirectory().describeGroup(groupId, options)),
    },
  }))
  provideAuthorisationGovernance(authorisationGovernanceFromIdentity({
    governance: {
      describeGroup: async input => (await prepareIam(), getIdentityAccessGovernance().describeGroup(input)),
      isOwner: async input => (await prepareIam(), getIdentityAccessGovernance().isOwner(input)),
      countOwners: async input => (await prepareIam(), getIdentityAccessGovernance().countOwners(input)),
    },
  }))
  provideAuthorisationSubjectResolver({ resolve: principalOf })
  provideAuthorisationPermissions(WESTRAY_PERMISSIONS)
  // The built-in roles, naming Identity's and Profile's high and critical permissions as
  // the suite asks. Nothing names the site's own changes yet (server/utils/permissions.ts).
  provideAuthorisationPolicy({
    roles: rolesWithIdentityPermissions({ permissions: [...IDENTITY_PERMISSIONS, ...PROFILE_PERMISSIONS], roles: DEFAULT_AUTHORISATION_POLICY.roles }),
  })
  provideAuthorisationLegalHolds(legalHoldsFromMembers({ part: 'authorisation', groupOrTenantHeld: identityLegalHoldCovers, personHeldParts: profileLegalHoldParts }))

  // Profile
  try {
    provideProfileKeyWrapper(createLocalProfileKeyWrapper(profileKeys()))
  }
  catch (error) {
    // Without keys Profile stores and shows nothing: it fails closed.
    console.error('[iam] Profile has no master key:', error instanceof Error ? error.message : error)
  }
  provideProfileDisclosureContext({ describe: async (request, options) => (await prepareIam(), getIdentityDisclosureContext().describe(request, options)) })
  provideProfileSubjectResolver(subjects)
  provideProfileAccessDecision(profileAccessDecisionFromAuthorisation({ authorise }))
  provideProfileRequestCoordinator(profileRequestCoordinatorFromMembers({
    exportIdentity: exportIdentityData,
    exportAuthentication: exportAuthenticationData,
    exportAuthorisation: exportAuthorisationData,
    exportConfiguration: exportConfigurationAccountData,
  }))
  provideProfileNotifier(createProfileNotifier(mail))

  if (!owner || !runtime) return
  provideAuthenticationDatabase({ dialect: 'postgres', pool: owner })
  migrateAuthenticationDatabase()
  provideAuthorisationDatabase({ dialect: 'postgres', pool: owner })
  migrateAuthorisationDatabase()
  provideIdentityDatabase({ dialect: 'postgres', pool: runtime })
  provideProfileDatabase({
    dialect: 'postgres',
    pool: runtime,
    migrationPool: owner,
    runtimeRole: runtimeRole(process.env.DATABASE_RUNTIME_URL!, process.env.DATABASE_URL!).name,
  })
  prepareIam()
    .then(() => relayIam())
    .catch(error => console.error('[iam] Identity could not start on its database.', error))
})
