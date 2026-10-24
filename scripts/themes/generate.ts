// Generates the four seasonal palettes in data/themes/ from Theme Manager's default
// palette: `pnpm themes:generate`. Each season moves the page-layer and purpose roles
// to its hue from the westray.uk mock-up, keeps the status roles' conventional hues so
// their meaning is not lost, then corrects any pair that misses Theme Manager's
// contrast rules. The output is data; edit a season here and regenerate.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createCanonicalThemeDefinition } from '@nuxt4-layers/theme-manager/contracts'
import { fromOklch, parseHex, toHex, toOklch, contrast } from './colour.ts'
import { EXEMPT_STATES, MODES, NON_TEXT_CONTRAST, PAGE_LAYERS, TEXT_CONTRAST, paletteFailures, rolesIn, type ColourModes, type Mode } from './check.ts'

interface Season {
  slug: string
  name: string
  description: string
  // OKLCH hue of the season, from the mock-up's palette.
  hue: number
  // Least chroma for layer fills, so pages carry the season's tint as on the mock-up.
  tint: Record<Mode, number>
}

const seasons: Season[] = [
  { slug: 'spring', name: 'Spring', description: 'Fresh greens, after the westray.uk spring palette.', hue: 152, tint: { light: 0.035, dark: 0.04 } },
  { slug: 'summer', name: 'Summer', description: 'Warm oranges, after the westray.uk summer palette.', hue: 55, tint: { light: 0.035, dark: 0.045 } },
  { slug: 'autumn', name: 'Autumn', description: 'Golden ambers, after the westray.uk autumn palette.', hue: 85, tint: { light: 0.04, dark: 0.04 } },
  { slug: 'winter', name: 'Winter', description: 'Clear sky blues, after the westray.uk winter palette.', hue: 232, tint: { light: 0.03, dark: 0.045 } },
]

// Roles that take the season's hue; the status roles keep theirs.
const SEASONAL_ROLES = new Set([...PAGE_LAYERS, 'accent', 'muted', 'input', 'link'])
const LAYERS = new Set<string>(PAGE_LAYERS)
// Margins above the thresholds, so rounding never tips a pair under them.
const TEXT_TARGET = TEXT_CONTRAST + 0.1
const NON_TEXT_TARGET = NON_TEXT_CONTRAST + 0.1

function shift(value: string, hue: number, minChroma = 0): string {
  const colour = toOklch(parseHex(value))
  // Near-greys keep their hue-less look unless a tint is asked for.
  const c = Math.max(colour.c, minChroma)
  return toHex(fromOklch({ ...colour, c, h: hue }))
}

function lighten(value: string, step: number): string {
  const colour = toOklch(parseHex(value))
  return toHex(fromOklch({ ...colour, l: Math.min(1, Math.max(0, colour.l + step)) }))
}

const isDark = (value: string) => toOklch(parseHex(value)).l < 0.6

/**
 * Moves the foreground away from the background until the pair reaches the target.
 * If the foreground reaches black or white first, the background moves instead.
 */
function separate(foreground: string, background: string, target: number): { foreground: string, background: string } {
  const away = isDark(background) ? 0.005 : -0.005
  let fg = foreground
  let bg = background
  for (let i = 0; i < 400 && contrast(fg, bg) < target; i++) {
    const next = lighten(fg, away)
    if (next === fg) bg = lighten(bg, -away)
    else fg = next
  }
  return { foreground: fg, background: bg }
}

function seasonalModes(season: Season): ColourModes {
  const canonical = createCanonicalThemeDefinition().modes as unknown as ColourModes
  const modes = structuredClone(canonical)

  for (const mode of MODES) {
    const colours = modes[mode]
    for (const [key, states] of Object.entries(colours)) {
      const [channel, role] = [key.slice(0, key.indexOf('-')), key.slice(key.indexOf('-') + 1)]
      for (const [state, value] of Object.entries(states)) {
        // The focus ring is one colour across the site, so it follows the season everywhere.
        const seasonal = SEASONAL_ROLES.has(role) || (channel === 'edge' && state === 'focus')
        if (!seasonal) continue
        const tinted = channel === 'fill' && LAYERS.has(role) && state !== 'shadow' && state !== 'disabled'
        states[state] = shift(value, season.hue, tinted ? season.tint[mode] : 0)
      }
    }

    // Correct Pen and Edge against their own Fill, state by state. Moving a Fill can
    // upset the other channel on it, so passes repeat until nothing moves.
    for (let pass = 0; pass < 10 && paletteFailures(modes).some(f => f.mode === mode); pass++) {
    for (const role of rolesIn(modes, mode)) {
      const fill = colours[`fill-${role}`]!
      for (const channel of ['pen', 'edge'] as const) {
        const foreground = colours[`${channel}-${role}`]!
        for (const state of Object.keys(foreground)) {
          if (EXEMPT_STATES.has(state) || (channel === 'edge' && state === 'focus') || !fill[state]) continue
          const fixed = separate(foreground[state]!, fill[state]!, channel === 'pen' ? TEXT_TARGET : NON_TEXT_TARGET)
          foreground[state] = fixed.foreground
          fill[state] = fixed.background
        }
      }
    }

    // The focus ring sits on any page layer, so it must clear the hardest one.
    for (const role of rolesIn(modes, mode)) {
      const edge = colours[`edge-${role}`]!
      if (!edge.focus) continue
      for (let i = 0; i < 400; i++) {
        const worst = PAGE_LAYERS.map(layer => colours[`fill-${layer}`]!.default!)
          .sort((a, b) => contrast(edge.focus!, a) - contrast(edge.focus!, b))[0]!
        if (contrast(edge.focus, worst) >= NON_TEXT_TARGET) break
        edge.focus = lighten(edge.focus, isDark(worst) ? 0.005 : -0.005)
      }
    }
    }
  }
  return modes
}

const root = fileURLToPath(new URL('../../data/themes/', import.meta.url))
for (const season of seasons) {
  const modes = seasonalModes(season)
  const failures = paletteFailures(modes)
  if (failures.length) {
    console.error(`${season.name}: ${failures.length} contrast failures`, failures.slice(0, 5))
    process.exitCode = 1
    continue
  }
  const palette = { id: `westray-${season.slug}`, name: season.name, description: season.description, modes }
  writeFileSync(`${root}${season.slug}.json`, `${JSON.stringify(palette, null, 2)}\n`)
  console.log(`${season.name}: written, every pair meets its contrast rule`)
}
