import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assertCompleteThemeVocabulary } from '@nuxt4-layers/theme-manager/contracts'
import { paletteFailures, PAGE_LAYERS, type ColourModes } from '../../scripts/themes/check'
import { contrast } from '../../scripts/themes/colour'
import { paletteTheme, type Palette } from '../../server/database/seed-themes'

const directory = new URL('../../data/themes/', import.meta.url)
const palettes: Palette[] = readdirSync(directory).filter(file => file.endsWith('.json')).sort()
  .map(file => JSON.parse(readFileSync(new URL(file, directory), 'utf8')))
const superAdminId = '00000000-0000-4000-8000-000000000001'

describe('example theme palettes', () => {
  it('are the four seasons', () => {
    expect(palettes.map(palette => palette.name).sort()).toEqual(['Autumn', 'Spring', 'Summer', 'Winter'])
  })

  for (const palette of palettes) {
    describe(palette.name, () => {
      it('meets Theme Manager\'s contrast rules in light and dark (WCAG 2.2 AA)', () => {
        expect(paletteFailures(palette.modes as unknown as ColourModes)).toEqual([])
      })

      it('becomes a valid, complete Theme owned by the super admin, published and public', () => {
        const theme = assertCompleteThemeVocabulary(paletteTheme(palette, superAdminId))
        expect(theme.id).toBe(palette.id)
        expect(theme.ownership).toEqual({ ownerType: 'user', ownerId: superAdminId })
        expect(theme.visibility).toBe('public')
        expect(theme.lifecycle).toBe('published')
      })

      it('gives its page layers the season\'s tint, distinct from the built-in default', () => {
        const floor = (palette.modes as unknown as ColourModes).light['fill-floor']!.default!
        expect(floor).not.toBe('#edf0f4ff')
      })
    })
  }

  it('each have their own colours', () => {
    const floors = palettes.map(palette => (palette.modes as unknown as ColourModes).light['fill-floor']!.default)
    expect(new Set(floors).size).toBe(palettes.length)
  })
})

describe('the contrast check', () => {
  it('matches WCAG for known pairs', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })

  it('catches a Pen that fails on its Fill, and a focus ring lost on a page layer', () => {
    const modes = structuredClone(palettes[0]!.modes) as unknown as ColourModes
    modes.light['pen-primary']!.default = modes.light['fill-primary']!.default!
    modes.dark['edge-accent']!.focus = modes.dark[`fill-${PAGE_LAYERS[0]}`]!.default!
    const failures = paletteFailures(modes)
    expect(failures.some(f => f.mode === 'light' && f.pair === 'pen-primary on fill-primary' && f.state === 'default')).toBe(true)
    expect(failures.some(f => f.mode === 'dark' && f.pair === 'edge-accent on fill-floor' && f.state === 'focus')).toBe(true)
  })
})
