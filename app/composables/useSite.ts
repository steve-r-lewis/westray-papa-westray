import type { ConfigurationAnswer } from '@nuxt4-layers/configuration/contracts'
import type { IconName } from '#shared/icons'
import { icons } from '#shared/icons'

// The site's facts, from Configuration's public values: name, tagline, locale,
// default theme, title template, description and social links. The key matches
// Configuration's own useConfiguration(), so its components share the one fetch.
const key = 'configuration:public:'

export function loadSite() {
  return useAsyncData(key, () => useRequestFetch()<ConfigurationAnswer>('/api/configuration/public'), {
    getCachedData: (cacheKey, nuxtApp) => nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey],
  })
}

export interface SocialLink { network: string, url: string }

export function useSite() {
  const { data } = useNuxtData<ConfigurationAnswer>(key)
  return computed(() => {
    const values = data.value?.values ?? {}
    const text = (name: string) => typeof values[name] === 'string' ? values[name] as string : ''
    return {
      name: text('site.name'),
      tagline: text('site.tagline'),
      locale: text('site.default-locale') || 'en-GB',
      defaultTheme: text('site.default-theme'),
      description: text('seo.description'),
      // Contains %s once, where the page title goes.
      titleTemplate: text('seo.title-template'),
      social: (Array.isArray(values['social.links']) ? values['social.links'] : []) as SocialLink[],
    }
  })
}

// The icon for a social network: its own where there is one, otherwise a generic link.
export function socialIcon(network: string): IconName {
  return network in icons ? network as IconName : 'share'
}
