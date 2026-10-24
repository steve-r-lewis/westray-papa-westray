import { defineConfigurationSetting } from '@nuxt4-layers/configuration/contracts'
import { z } from 'zod'

// Demonstration mode, for a separate pre-launch deployment only: a banner on every
// page, nothing indexed, and invented content (data/demo/) seeded beside the real.
// Both settings are the application's own, declared with Configuration and `locked`,
// so only the deployment sets them (DEMO_MODE and DEMO_LAUNCH_DATE in its
// environment) and nobody can change them at run time.

export const DEMO_SETTINGS = [
  defineConfigurationSetting({
    key: 'demo.enabled',
    schema: z.boolean(),
    scopes: ['platform'],
    visibility: 'public',
    default: false,
    sensitivity: 'organisational',
    risk: 'high',
    locked: true,
  }),
  // The day the real site launches, or null while it is still to be announced.
  defineConfigurationSetting({
    key: 'demo.launch-date',
    schema: z.iso.date({ error: 'not-a-date' }).nullable(),
    scopes: ['platform'],
    visibility: 'public',
    default: null,
    sensitivity: 'organisational',
    risk: 'high',
    locked: true,
  }),
]

export interface DemoDeployment {
  'demo.enabled': boolean
  'demo.launch-date': string | null
}

/** The deployment's demonstration settings, from its environment. Anything but `true` is off. */
export function demoDeployment(env: Readonly<Record<string, string | undefined>> = process.env): DemoDeployment {
  const enabled = env.DEMO_MODE?.trim().toLowerCase() === 'true'
  const launchDate = env.DEMO_LAUNCH_DATE?.trim() || null
  if (launchDate !== null && !z.iso.date().safeParse(launchDate).success) {
    throw new TypeError('DEMO_LAUNCH_DATE must be a date (YYYY-MM-DD), or empty while it is to be announced.')
  }
  return { 'demo.enabled': enabled, 'demo.launch-date': launchDate }
}
