// Follows the device when the preference is "system", and re-applies after hydration.
export default defineNuxtPlugin(() => {
  const { preference } = useColourMode()
  applyColourMode(preference.value)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (preference.value === 'system') applyColourMode('system')
  })
})
