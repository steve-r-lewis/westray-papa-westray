import deployment from '../../data/configuration.json'

// Connects Configuration. The site's facts (name, tagline, locale, default theme,
// title template, social links, organisation and contacts) are deployment values from
// data/configuration.json: they need no sign-in or approval. Its administration asks
// Identity (groups, owners, approval routes) and Authorisation (who may request and
// approve a change) through Configuration's own adapters; the platform scope belongs to
// the platform group (server/utils/iam.ts), and nobody holds
// `configuration.platform-settings:manage`, so every change is still refused and the
// administration pages stay off until editing on the site arrives (slice 1c part 2).
// The application declares its own demonstration settings, locked, so they come from
// the deployment's environment alone (server/utils/demo.ts).
export default defineNitroPlugin(async () => {
  provideConfigurationCatalogue(DEMO_SETTINGS)
  provideConfigurationDeployment({ ...deployment, ...demoDeployment() })
  provideConfigurationSubjectResolver(configurationSubjectResolverFromAuthentication({ getAuthenticatedPrincipal: principalOf }))
  provideConfigurationDirectory(configurationDirectoryFromIdentity({
    resolveActor: async (identityId, options) => (await prepareIam(), getIdentityDirectory().resolveActor(identityId, options)),
    describeGroup: async (groupId, options) => (await prepareIam(), getIdentityDirectory().describeGroup(groupId, options)),
  }))
  provideConfigurationGovernance(configurationGovernanceFromIdentity({
    describeGroup: async input => (await prepareIam(), getIdentityAccessGovernance().describeGroup(input)),
    isOwner: async input => (await prepareIam(), getIdentityAccessGovernance().isOwner(input)),
    countOwners: async input => (await prepareIam(), getIdentityAccessGovernance().countOwners(input)),
  }))
  provideConfigurationAccessDecision(configurationAccessDecisionFromAuthorisation({
    qualifies: authorisationQualifies,
    countQualifying: countAuthorisationQualifying,
  }))

  const pool = useDatabasePool()
  if (!pool) return
  provideConfigurationDatabase({ dialect: 'postgres', pool })
  try {
    await migrateConfigurationDatabase()
  }
  catch (error) {
    // Deployment values and defaults are still served; stored values wait for the database.
    console.error('Configuration could not migrate its database.', error)
  }
})
