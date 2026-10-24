import { readFileSync } from 'node:fs'
import { buildConfigurationCatalogue, CONFIGURATION_SETTINGS } from '@nuxt4-layers/configuration/contracts'
import { describe, expect, it } from 'vitest'
import { DEMO_SETTINGS, demoDeployment } from '../../server/utils/demo'
import { robotsTxt } from '../../server/utils/robots'
import { securityTxt } from '../../server/utils/security-txt'

const values: Record<string, unknown> = JSON.parse(readFileSync(new URL('../../data/configuration.json', import.meta.url), 'utf8'))

describe('demonstration mode', () => {
  it('is off unless the deployment sets DEMO_MODE=true', () => {
    expect(demoDeployment({})).toEqual({ 'demo.enabled': false, 'demo.launch-date': null })
    expect(demoDeployment({ DEMO_MODE: 'yes' })['demo.enabled']).toBe(false)
    expect(demoDeployment({ DEMO_MODE: 'true', DEMO_LAUNCH_DATE: '2027-03-01' })).toEqual({ 'demo.enabled': true, 'demo.launch-date': '2027-03-01' })
    expect(demoDeployment({ DEMO_MODE: 'TRUE', DEMO_LAUNCH_DATE: ' ' })).toEqual({ 'demo.enabled': true, 'demo.launch-date': null })
  })

  it('refuses a launch date that is not a date', () => {
    expect(() => demoDeployment({ DEMO_MODE: 'true', DEMO_LAUNCH_DATE: 'spring' })).toThrow(/DEMO_LAUNCH_DATE/)
  })

  it('is set by the deployment alone: locked, public and off by default', () => {
    const catalogue = buildConfigurationCatalogue(CONFIGURATION_SETTINGS, DEMO_SETTINGS)
    for (const key of ['demo.enabled', 'demo.launch-date']) {
      expect(catalogue.get(key)).toMatchObject({ locked: true, visibility: 'public', scopes: ['platform'] })
    }
    expect(catalogue.get('demo.enabled')!.default).toBe(false)
  })
})

describe('robots.txt', () => {
  it('disallows everything on the demonstration', () => {
    expect(robotsTxt(true, 'https://demo.example')).toBe('User-agent: *\nDisallow: /\n')
  })

  it('allows everything otherwise, and names the sitemap', () => {
    expect(robotsTxt(false, 'https://westray.example')).toContain('Sitemap: https://westray.example/sitemap.xml')
    expect(robotsTxt(false, 'https://westray.example')).not.toContain('Disallow')
  })
})

describe('the platform\'s contacts', () => {
  it('name the organisation and a contact for each role', () => {
    expect(values['organisation.legal-name']).toBe('Westray Digital Access Group')
    for (const role of ['general', 'data-protection', 'security']) {
      expect(values[`contact.${role}`], role).toMatchObject({ email: 'chuckme@busigraph.com' })
    }
  })

  it('give security.txt its contact, a near expiry, the policy and the canonical address', () => {
    const text = securityTxt(values['contact.security'], 'https://westray.example', new Date('2026-10-24T10:00:00Z'))!
    expect(text).toContain('Contact: mailto:chuckme@busigraph.com\n')
    expect(text).toContain('Expires: 2027-04-22T00:00:00Z\n')
    expect(text).toMatch(/^Policy: https:\/\/github\.com\/.+SECURITY\.md$/m)
    expect(text).toContain('Canonical: https://westray.example/.well-known/security.txt\n')
  })

  it('serve no security.txt without a contact', () => {
    expect(securityTxt(undefined, 'https://westray.example', new Date())).toBeNull()
    expect(securityTxt({ policy: '/security' }, 'https://westray.example', new Date())).toBeNull()
  })
})
