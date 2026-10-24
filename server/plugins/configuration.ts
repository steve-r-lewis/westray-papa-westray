import deployment from '../../data/configuration.json'

// Connects Configuration. The site's facts (name, tagline, locale, default theme,
// title template, social links) are deployment values from data/configuration.json:
// they need no sign-in or approval. Once Identity and Authorisation are composed in
// slice 1c, administrators can override them at the platform scope.
export default defineNitroPlugin(async () => {
  provideConfigurationCatalogue([])
  provideConfigurationDeployment(deployment)
  // Nobody can sign in until slice 1c, so every request is anonymous.
  provideConfigurationSubjectResolver({ resolve: async () => null })

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
