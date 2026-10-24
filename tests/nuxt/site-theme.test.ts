import { describe, expect, it } from 'vitest'
import { themeDefinitionToRuntime } from '@nuxt4-layers/theme-manager/contracts'
import { paletteTheme, type Palette } from '~~/server/database/seed-themes'
import spring from '~~/data/themes/spring.json'

const theme = themeDefinitionToRuntime(paletteTheme(spring as unknown as Palette, 'admin'))

describe('the server-rendered theme rule', () => {
  it('carries the theme\'s colours for both modes', () => {
    const rule = themeStyleRule(theme)
    expect(rule.startsWith('html:root{')).toBe(true)
    expect(rule).toContain(`--ui-fill-floor-default-light:${spring.modes.light['fill-floor'].default}`)
    expect(rule).toContain(`--ui-fill-floor-default-dark:${spring.modes.dark['fill-floor'].default}`)
  })

  it('leaves out a value that could break out of the rule or the style element', () => {
    const hostile = structuredClone(theme)
    hostile.modes.light['fill-floor']!.default = 'red}</style><script>alert(1)</script>'
    hostile.modes.light['fill-base']!.default = 'red;} body{display:none'
    const rule = themeStyleRule(hostile)
    expect(rule).not.toContain('<')
    expect(rule).not.toContain('display:none')
    expect(rule.indexOf('}')).toBe(rule.length - 1)
  })
})
