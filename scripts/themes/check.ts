import { contrast } from './colour.ts'

// Theme Manager's contrast rules for a colour palette (WCAG 2.2 AA), judged per role,
// state and mode: Pen on its own Fill at 4.5:1, Edge on its own Fill at 3:1, and the
// focus ring against every page layer it can sit on at 3:1. Disabled is exempt and
// shadow colours are translucent tints, as in Theme Manager's own palette tests.

export const TEXT_CONTRAST = 4.5
export const NON_TEXT_CONTRAST = 3
export const MODES = ['light', 'dark'] as const
export const PAGE_LAYERS = ['floor', 'base', 'primary', 'secondary', 'tertiary'] as const
export const EXEMPT_STATES = new Set(['disabled', 'shadow'])

export type Mode = (typeof MODES)[number]
export type ColourModes = Record<Mode, Record<string, Record<string, string>>>

export interface ContrastFailure {
  mode: Mode
  pair: string
  state: string
  ratio: number
  required: number
}

export function rolesIn(modes: ColourModes, mode: Mode): string[] {
  return [...new Set(Object.keys(modes[mode]).map(key => key.slice(key.indexOf('-') + 1)))]
}

export function paletteFailures(modes: ColourModes): ContrastFailure[] {
  const failures: ContrastFailure[] = []
  for (const mode of MODES) {
    const colours = modes[mode]
    for (const role of rolesIn(modes, mode)) {
      const fill = colours[`fill-${role}`] ?? {}
      for (const channel of ['pen', 'edge'] as const) {
        const foreground = colours[`${channel}-${role}`] ?? {}
        const required = channel === 'pen' ? TEXT_CONTRAST : NON_TEXT_CONTRAST
        for (const [state, value] of Object.entries(foreground)) {
          if (EXEMPT_STATES.has(state)) continue
          if (channel === 'edge' && state === 'focus') {
            for (const layer of PAGE_LAYERS) {
              const ratio = contrast(value, colours[`fill-${layer}`]!.default!)
              if (ratio < required) failures.push({ mode, pair: `edge-${role} on fill-${layer}`, state, ratio, required })
            }
            continue
          }
          const background = fill[state]
          if (!background) continue
          const ratio = contrast(value, background)
          if (ratio < required) failures.push({ mode, pair: `${channel}-${role} on fill-${role}`, state, ratio, required })
        }
      }
    }
  }
  return failures
}
