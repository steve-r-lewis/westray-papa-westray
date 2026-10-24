import type { AuthorisationPermissionDefinitionInput } from '@nuxt4-layers/authorisation/contracts'
import { CONFIGURATION_PERMISSIONS } from '@nuxt4-layers/configuration/contracts'
import { IDENTITY_PERMISSIONS } from '@nuxt4-layers/identity/contracts'
import { PROFILE_PERMISSIONS } from '@nuxt4-layers/profile/contracts'
import { buildPublisherRegistry, PUBLISHER_PERMISSION_ACTIONS, publisherPermissions } from '@nuxt4-layers/publisher/contracts'
import type { ThemeAction } from '@nuxt4-layers/theme-manager/contracts'
import { WESTRAY_DOCUMENT_TYPES } from './document-types'

// Authorisation's permission catalogue: every permission the composed layers ask it
// about, in its `<resource>:<action>` grammar. A permission missing from the catalogue
// is never granted, so whatever a layer asks that is not listed here is refused.

/** Publisher's `publisher.<type>.<action>` as Authorisation names it: `publisher.<type>:<action>`. */
export function publisherAuthorisationPermission(permission: string): string | null {
  const match = /^publisher\.([a-z][a-z0-9-]*)\.([a-z-]+)$/.exec(permission)
  if (!match || !(PUBLISHER_PERMISSION_ACTIONS as readonly string[]).includes(match[2]!)) return null
  return `publisher.${match[1]}:${match[2]!.replaceAll('-', '_')}`
}

const PUBLISHER_DESCRIPTIONS: Record<string, string> = {
  'view-draft': 'See unpublished versions of',
  'edit': 'Create and change',
  'publish': 'Publish, schedule, unpublish and archive',
  'moderate': 'Moderate',
}

export const PUBLISHER_AUTHORISATION_PERMISSIONS: AuthorisationPermissionDefinitionInput[] =
  publisherPermissions(buildPublisherRegistry(WESTRAY_DOCUMENT_TYPES)).map(({ permission, risk, type, action }) => ({
    name: publisherAuthorisationPermission(permission)!,
    description: `${PUBLISHER_DESCRIPTIONS[action]} documents of the type ${type}`,
    risk,
    effect: action === 'view-draft' ? 'view' : 'change',
  }))

// Theme Manager's changes. Every one is `high`, so no role's wildcard reaches it: only
// a role naming it grants it, and none does yet. Reading and using a theme are decided
// by its visibility (server/utils/theme-policy.ts), never here.
const THEME_CHANGES = {
  'theme.create': 'Create a theme',
  'theme.edit': 'Change a theme',
  'theme.delete': 'Delete a theme',
  'theme.publish': 'Publish a theme',
  'theme.share': 'Change who a theme is offered to',
  'theme.import': 'Import a theme',
  'theme.export': 'Export a theme',
  'theme.assign': 'Make a theme the default',
} as const satisfies Partial<Record<ThemeAction, string>>

export type ThemeChange = keyof typeof THEME_CHANGES

export const isThemeChange = (action: ThemeAction): action is ThemeChange => action in THEME_CHANGES

/** Theme Manager's `theme.<action>` as Authorisation names it: `themes:<action>`. */
export const themeAuthorisationPermission = (action: ThemeChange): string => `themes:${action.slice('theme.'.length)}`

export const THEME_AUTHORISATION_PERMISSIONS: AuthorisationPermissionDefinitionInput[] =
  Object.entries(THEME_CHANGES).map(([action, description]) => ({
    name: themeAuthorisationPermission(action as ThemeChange),
    description,
    risk: 'high',
    effect: 'change',
  }))

export const CONFIGURATION_AUTHORISATION_PERMISSIONS: AuthorisationPermissionDefinitionInput[] =
  CONFIGURATION_PERMISSIONS.map(({ permission, risk, effect }) => ({
    name: permission,
    description: effect === 'view' ? 'See a scope\'s settings' : `Request and approve changes to ${permission.slice('configuration.'.length, permission.indexOf(':')).replace('-', ' ')}`,
    risk,
    effect: effect === 'view' ? 'view' : 'change',
  }))

export const WESTRAY_PERMISSIONS: AuthorisationPermissionDefinitionInput[] = [
  ...IDENTITY_PERMISSIONS,
  ...PROFILE_PERMISSIONS,
  ...CONFIGURATION_AUTHORISATION_PERMISSIONS,
  ...PUBLISHER_AUTHORISATION_PERMISSIONS,
  ...THEME_AUTHORISATION_PERMISSIONS,
]

/** A permission's risk in the catalogue, or null if it is not there. */
export function westrayPermissionRisk(permission: string) {
  return WESTRAY_PERMISSIONS.find(definition => definition.name === permission)?.risk ?? null
}
