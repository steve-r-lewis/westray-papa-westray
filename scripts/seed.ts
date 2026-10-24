// Seeds the database: `pnpm db:seed`, or `pnpm db:seed --update` to overwrite seeded
// rows that already exist. Reads DATABASE_URL, PLATFORM_SUPER_ADMIN_ID and DEMO_MODE
// from the environment, or from .env when present. Run `pnpm db:migrate` first.
//
// Themes come from data/themes/ and content from data/content/. In demonstration mode
// (DEMO_MODE=true) the invented content in data/demo/ is added too; it is never
// loaded otherwise.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import postgres from 'postgres'
import { readContentFiles } from '../server/database/content-files.ts'
import { seedContent } from '../server/database/seed-content.ts'
import { readPalettes, seedThemes } from '../server/database/seed-themes.ts'
import { demoDeployment } from '../server/utils/demo.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
if (existsSync(`${root}.env`)) process.loadEnvFile(`${root}.env`)

const url = process.env.DATABASE_URL
const superAdminId = process.env.PLATFORM_SUPER_ADMIN_ID
if (!url || !superAdminId) {
  console.error('DATABASE_URL and PLATFORM_SUPER_ADMIN_ID must be set; copy .env.example to .env')
  process.exit(1)
}

const update = process.argv.includes('--update')
const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
const pool = new pg.Pool({ connectionString: url, max: 2 })
try {
  const demo = demoDeployment()['demo.enabled']
  const themes = await seedThemes(sql, await readPalettes(`${root}data/themes`), { superAdminId, update })
  console.log(`Themes: ${themes.added.length} added, ${themes.updated.length} updated, ${themes.unchanged.length} already present`)

  const sources = [
    ...await readContentFiles(`${root}data/content`),
    ...(demo ? await readContentFiles(`${root}data/demo`) : []),
  ]
  const content = await seedContent(pool, sources, { today: new Date(), update })
  console.log(`Content${demo ? ', with the demonstration content' : ''}: ${content.added.length} added, ${content.updated.length} updated, ${content.unchanged.length} already present`)
}
catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
finally {
  await sql.end()
  await pool.end()
}
