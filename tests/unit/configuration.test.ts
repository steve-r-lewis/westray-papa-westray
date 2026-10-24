import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CONFIGURATION_SETTINGS, SOCIAL_NETWORKS } from '@nuxt4-layers/configuration/contracts'
import { shellSchema } from '../../shared/shell'

const values: Record<string, unknown> = JSON.parse(readFileSync(new URL('../../data/configuration.json', import.meta.url), 'utf8'))
const shell = shellSchema.parse(JSON.parse(readFileSync(new URL('../../data/shell.json', import.meta.url), 'utf8')))
const themeIds = readdirSync(new URL('../../data/themes/', import.meta.url))
  .filter(file => file.endsWith('.json'))
  .map(file => JSON.parse(readFileSync(new URL(`../../data/themes/${file}`, import.meta.url), 'utf8')).id as string)

describe('the site\'s Configuration values', () => {
  it('are all declared settings, each valid against its declaration', () => {
    for (const [key, value] of Object.entries(values)) {
      const declaration = CONFIGURATION_SETTINGS.find(setting => setting.key === key)
      expect(declaration, key).toBeDefined()
      expect(declaration!.schema.safeParse(value).success, key).toBe(true)
    }
  })

  it('name the site, its tagline, locale and title template', () => {
    for (const key of ['site.name', 'site.tagline', 'site.default-locale', 'seo.title-template']) {
      expect(values[key], key).toBeTruthy()
    }
  })

  it('choose a default theme that the seed provides', () => {
    expect(themeIds).toContain(values['site.default-theme'])
  })

  it('leave no social network the shell cannot name', () => {
    for (const network of SOCIAL_NETWORKS) {
      expect(shell.labels.networks[network], network).toBeTruthy()
    }
  })
})
