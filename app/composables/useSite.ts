import type { ConfigurationAnswer } from '@nuxt4-layers/configuration/contracts'
import type { IconName } from '#shared/icons'
import { icons } from '#shared/icons'

// The site's facts, from Configuration's public values: name, tagline, locale,
// default theme, title template, description, social links, the organisation and its
// contacts, and whether this is the pre-launch demonstration. The key matches
// Configuration's own useConfiguration(), so its components share the one fetch.
const key = 'configuration:public:'

export function loadSite() {
  return useAsyncData(key, () => useRequestFetch()<ConfigurationAnswer>('/api/configuration/public'), {
    getCachedData: (cacheKey, nuxtApp) => nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey],
  })
}

export interface SocialLink { network: string, url: string }

export interface ContactPoint { email?: string, phone?: string, url?: string }

// The platform's contacts, by role, as the Contact page lists them.
export const CONTACT_ROLES = ['general', 'data-protection', 'security'] as const
export type ContactRole = (typeof CONTACT_ROLES)[number]

export function useSite() {
  const { data } = useNuxtData<ConfigurationAnswer>(key)
  return computed(() => {
    const values = data.value?.values ?? {}
    const text = (name: string) => typeof values[name] === 'string' ? values[name] as string : ''
    const contact = (name: string) => (values[name] && typeof values[name] === 'object' ? values[name] as ContactPoint : null)
    return {
      name: text('site.name'),
      tagline: text('site.tagline'),
      locale: text('site.default-locale') || 'en-GB',
      defaultTheme: text('site.default-theme'),
      description: text('seo.description'),
      // Contains %s once, where the page title goes.
      titleTemplate: text('seo.title-template'),
      social: (Array.isArray(values['social.links']) ? values['social.links'] : []) as SocialLink[],
      organisation: text('organisation.legal-name'),
      contacts: Object.fromEntries(CONTACT_ROLES.map(role => [role, contact(`contact.${role}`)])) as Record<ContactRole, ContactPoint | null>,
      demo: {
        enabled: values['demo.enabled'] === true,
        // YYYY-MM-DD, or empty while the launch date is to be announced.
        launchDate: text('demo.launch-date'),
      },
    }
  })
}

// The icon for a social network: its own where there is one, otherwise a generic link.
export function socialIcon(network: string): IconName {
  return network in icons ? network as IconName : 'share'
}
