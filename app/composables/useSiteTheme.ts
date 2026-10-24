import { createThemeApplication, type RuntimeTheme } from '@nuxt4-layers/theme-manager/contracts'

// Theme Manager checks token names but accepts any text as a value. In a <style>
// element a value could end the declaration, the rule or the element itself, so any
// value that could is left out here; Theme Manager's client plugin still applies it
// safely through setProperty.
const UNSAFE_VALUE = /[<>{};\\]/

/** The active theme as one CSS rule, for the server's HTML. */
export function themeStyleRule(theme: RuntimeTheme): string {
  const declarations: string[] = []
  createThemeApplication({
    setProperty: (name, value) => {
      if (!UNSAFE_VALUE.test(value)) declarations.push(`${name}:${value}`)
    },
    removeProperty: () => '',
  }).apply(theme)
  return `html:root{${declarations.join(';')}}`
}

/**
 * Renders the active theme's values into the server's HTML, so the page never
 * flashes Theme Manager's built-in default before its client plugin applies the
 * theme. The theme itself is chosen by middleware/theme-site-default.global.ts.
 */
export function useSiteTheme() {
  const runtime = useThemeRuntime()
  if (!import.meta.server || !runtime.activeTheme.value) return
  useHead({ style: [{ key: 'active-theme', textContent: themeStyleRule(runtime.activeTheme.value) }] })
}
