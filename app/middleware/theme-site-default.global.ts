import { themeDefinitionToRuntime, type RuntimeTheme } from '@nuxt4-layers/theme-manager/contracts'

// Runs after Theme Manager's own middleware (theme-runtime.global), which falls back
// to its built-in default whenever the visitor has chosen nothing. This puts the
// site's default theme in its place instead, without setting a cookie: the visitor
// gets one only by choosing a palette.
export default defineNuxtRouteMiddleware(async () => {
  const nuxtApp = useNuxtApp()
  const runtime = useThemeRuntime()
  if (runtime.selectedThemeId.value || runtime.activeTheme.value) return

  const siteTheme = useState<RuntimeTheme | null>('site-theme', () => null)
  if (!siteTheme.value) {
    const { data: shell } = await loadShell()
    if (!shell.value) return
    try {
      const theme = themeDefinitionToRuntime(await useThemeManagement().loadTheme(shell.value.themes.default))
      nuxtApp.runWithContext(() => (siteTheme.value = theme))
    }
    catch {
      // No storage or no such theme: Theme Manager's built-in default stays.
      return
    }
  }
  runtime.activeTheme.value = siteTheme.value
})
