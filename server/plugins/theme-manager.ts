// Connects Theme Manager's ports: storage on PostgreSQL, and the actor and access
// policy in server/utils/theme-policy.ts. Without DATABASE_URL Theme Manager runs on
// its built-in default theme.
export default defineNitroPlugin(() => {
  provideThemeActorContext(anonymousThemeActor)
  provideThemeAuthorization(themeAccessPolicy)

  const sql = useDatabase()
  if (sql) {
    const store = createThemeStore(sql)
    provideThemeRepository({ getThemeRepository: () => store })
  }
})
