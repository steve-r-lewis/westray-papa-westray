import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Sql } from 'postgres'
import {
  createCanonicalThemeDefinition,
  parsePersistedTheme,
  serializeThemeDefinition,
  type ThemeDefinition,
} from '@nuxt4-layers/theme-manager/contracts'
import { createThemeStore } from '../utils/theme-store.ts'

// Loads the example palettes in data/themes/ as Themes owned by the platform's super
// admin, published and public, so every visitor can choose them. Each palette holds
// only colours; the rest of the presentation is Theme Manager's default.

export interface Palette {
  id: string
  name: string
  description: string
  modes: ThemeDefinition['modes']
}

export interface SeedResult {
  added: string[]
  updated: string[]
  unchanged: string[]
}

export async function readPalettes(directory: string): Promise<Palette[]> {
  const files = (await readdir(directory)).filter(file => file.endsWith('.json')).sort()
  return Promise.all(files.map(async file => JSON.parse(await readFile(join(directory, file), 'utf8')) as Palette))
}

export function paletteTheme(palette: Palette, superAdminId: string): ThemeDefinition {
  const base = createCanonicalThemeDefinition({
    id: palette.id,
    name: palette.name,
    description: palette.description,
    ownerType: 'user',
    ownerId: superAdminId,
  })
  // Validated by Theme Manager before anything is stored.
  return parsePersistedTheme(serializeThemeDefinition({
    ...base,
    visibility: 'public',
    lifecycle: 'published',
    modes: palette.modes,
  }))
}

/**
 * Adds any palette not yet stored. A stored theme is left as it is, since its owner may
 * have changed it, unless `update` is set.
 */
export async function seedThemes(
  sql: Sql,
  palettes: Palette[],
  options: { superAdminId: string, update?: boolean },
): Promise<SeedResult> {
  const store = createThemeStore(sql)
  const result: SeedResult = { added: [], updated: [], unchanged: [] }
  for (const palette of palettes) {
    const theme = paletteTheme(palette, options.superAdminId)
    const existing = await store.findById(theme.id)
    if (existing && !options.update) {
      result.unchanged.push(theme.id)
      continue
    }
    await store.save(serializeThemeDefinition(theme))
    result[existing ? 'updated' : 'added'].push(theme.id)
  }
  return result
}
