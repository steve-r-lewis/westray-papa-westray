import type { Sql } from 'postgres'
import type { JsonValue, ThemeRepository } from '@nuxt4-layers/theme-manager/contracts'

// Theme Manager's storage port on PostgreSQL. It only stores and returns JSON:
// Theme Manager parses and validates every value it reads back.
export function createThemeStore(sql: Sql): ThemeRepository {
  return {
    async findById(id) {
      const [row] = await sql<{ definition: JsonValue }[]>`select definition from themes where id = ${id}`
      return row?.definition ?? null
    },
    async list() {
      const rows = await sql<{ definition: JsonValue }[]>`select definition from themes order by id`
      return rows.map(row => row.definition)
    },
    async save(theme) {
      if (!theme || typeof theme !== 'object' || Array.isArray(theme) || typeof theme.id !== 'string' || !theme.id) {
        throw new TypeError('A Theme Definition with an id was expected.')
      }
      await sql`
        insert into themes (id, definition) values (${theme.id}, ${sql.json(theme)})
        on conflict (id) do update set definition = excluded.definition, updated_at = now()
      `
    },
    async delete(id) {
      await sql`delete from themes where id = ${id}`
    },
  }
}
