import type { Shell } from '#shared/shell'

const key = 'shell'

// Fetches the shell once per visit; app.vue awaits it before anything renders.
export function loadShell() {
  return useAsyncData(key, () => $fetch<Shell>('/api/shell'), {
    getCachedData: (cacheKey, nuxtApp) => nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey],
  })
}

// The loaded shell, for any component below app.vue.
export function useShell() {
  const { data } = useNuxtData<Shell>(key)
  return computed(() => {
    if (!data.value) throw createError({ statusCode: 500, statusMessage: 'Shell not loaded', fatal: true })
    return data.value
  })
}
