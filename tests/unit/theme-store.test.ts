import { fileURLToPath } from 'node:url'
import postgres, { type Sql } from 'postgres'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parsePersistedTheme, serializeThemeDefinition } from '@nuxt4-layers/theme-manager/contracts'
import { migrate, readMigrations } from '../../server/database/migrate'
import { paletteTheme, readPalettes, seedThemes } from '../../server/database/seed-themes'
import { createThemeStore } from '../../server/utils/theme-store'

const url = process.env.DATABASE_URL
const migrations = fileURLToPath(new URL('../../server/database/migrations', import.meta.url))
const themes = fileURLToPath(new URL('../../data/themes', import.meta.url))
const superAdminId = '00000000-0000-4000-8000-000000000001'

// Needs PostgreSQL: CI provides it; locally run `pnpm db:up` and set DATABASE_URL.
describe.skipIf(!url)('theme storage and seeding', () => {
  const admin = url ? postgres(url, { max: 1, onnotice: () => {} }) : (undefined as unknown as Sql)
  let schema: string
  let sql: Sql

  beforeEach(async () => {
    schema = `test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    await admin.unsafe(`create schema ${schema}`)
    sql = postgres(url!, { prepare: false, max: 2, onnotice: () => {}, connection: { search_path: schema } })
    await migrate(sql, await readMigrations([{ name: 'app', directory: migrations }]))
  })

  afterEach(async () => {
    await sql.end()
    await admin.unsafe(`drop schema ${schema} cascade`)
  })

  afterAll(async () => {
    await admin.end()
  })

  it('seeds the four palettes once, as the super admin\'s public themes', async () => {
    const palettes = await readPalettes(themes)
    expect(await seedThemes(sql, palettes, { superAdminId })).toEqual({
      added: ['westray-autumn', 'westray-spring', 'westray-summer', 'westray-winter'],
      updated: [],
      unchanged: [],
    })
    const again = await seedThemes(sql, palettes, { superAdminId })
    expect(again.unchanged).toHaveLength(4)

    const rows = await sql`select id, owner_type, owner_id, visibility from themes order by id`
    expect(rows.map(row => ({ ...row }))).toEqual(palettes.map(palette => ({
      id: palette.id, owner_type: 'user', owner_id: superAdminId, visibility: 'public',
    })).sort((a, b) => a.id.localeCompare(b.id)))
  })

  it('leaves a stored theme alone unless asked to update it', async () => {
    const palettes = await readPalettes(themes)
    await seedThemes(sql, palettes, { superAdminId })
    const store = createThemeStore(sql)
    const changed = { ...paletteTheme(palettes[0]!, superAdminId), name: 'Renamed by its owner' }
    await store.save(serializeThemeDefinition(changed))

    await seedThemes(sql, palettes, { superAdminId })
    expect(parsePersistedTheme((await store.findById(changed.id))!).name).toBe('Renamed by its owner')

    const result = await seedThemes(sql, palettes, { superAdminId, update: true })
    expect(result.updated).toHaveLength(4)
    expect(parsePersistedTheme((await store.findById(changed.id))!).name).toBe(palettes[0]!.name)
  })

  it('stores, lists and deletes themes through Theme Manager\'s port', async () => {
    const store = createThemeStore(sql)
    const theme = serializeThemeDefinition(paletteTheme((await readPalettes(themes))[0]!, superAdminId))
    await store.save(theme)
    expect(await store.findById((theme as { id: string }).id)).toEqual(theme)
    expect(await store.list()).toHaveLength(1)
    await store.delete((theme as { id: string }).id)
    expect(await store.findById((theme as { id: string }).id)).toBeNull()
  })

  it('refuses a row whose id differs from its definition\'s', async () => {
    await expect(sql`insert into themes (id, definition) values ('one', ${sql.json({ id: 'two' })})`).rejects.toThrow(/check/)
  })
})
