import { fileURLToPath } from 'node:url'
import pg from 'pg'
import postgres from 'postgres'
import { afterAll } from 'vitest'
import type { ContentSource } from '../../server/database/content-files'
import { migrate, readMigrations } from '../../server/database/migrate'
import { seedContent } from '../../server/database/seed-content'

export const root = fileURLToPath(new URL('../..', import.meta.url))

/**
 * A database of the test's own beside DATABASE_URL's, migrated and seeded with the
 * given content, and dropped after the tests. Its URL is for the built site's
 * environment. Call before `setup()`, so it is dropped after the server stops.
 */
export async function testDatabase(name: string, sources: ContentSource[]): Promise<string> {
  const admin = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, onnotice: () => {} })
  const database = `wpw_${name}_${process.pid}_${Date.now()}`
  await admin.unsafe(`create database "${database}"`)
  afterAll(async () => {
    await admin.unsafe(`drop database if exists "${database}" with (force)`)
    await admin.end()
  })
  const url = new URL(process.env.DATABASE_URL!)
  url.pathname = `/${database}`

  const sql = postgres(url.href, { prepare: false, max: 1, onnotice: () => {} })
  await migrate(sql, await readMigrations([{ name: 'app', directory: `${root}server/database/migrations` }]))
  await sql.end()
  const pool = new pg.Pool({ connectionString: url.href, max: 2 })
  await seedContent(pool, sources, { today: new Date() })
  await pool.end()
  return url.href
}
