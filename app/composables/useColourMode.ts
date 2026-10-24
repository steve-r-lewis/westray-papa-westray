// Light, dark or the device's choice. Theme Manager maps light colours on :root and
// dark ones on html.dark; choosing the mode and setting that class is the host's job.
// The script in nuxt.config.ts sets the class before first paint; this keeps it right.

export const COLOUR_MODES = ['system', 'light', 'dark'] as const
export type ColourMode = (typeof COLOUR_MODES)[number]
export const COLOUR_MODE_COOKIE = 'colour-mode'

export function useColourMode() {
  // No default value, so no cookie is set until the visitor chooses a mode.
  const cookie = useCookie<string | undefined>(COLOUR_MODE_COOKIE, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  })

  const preference = computed<ColourMode>({
    get: () => (COLOUR_MODES as readonly string[]).includes(cookie.value ?? '') ? cookie.value as ColourMode : 'system',
    set: (mode) => {
      cookie.value = mode
      applyColourMode(mode)
    },
  })

  return { preference }
}

export function prefersDark(mode: ColourMode): boolean {
  return mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}

export function applyColourMode(mode: ColourMode): void {
  const dark = prefersDark(mode)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}
