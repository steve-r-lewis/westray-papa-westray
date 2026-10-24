// Seeds the database: `pnpm db:seed`, or `pnpm db:seed --update` to overwrite seeded
// rows that already exist. Reads DATABASE_URL and PLATFORM_SUPER_ADMIN_ID from the
// environment, or from .env when present. Run `pnpm db:migrate` first.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { readPalettes, seedThemes } from '../server/database/seed-themes.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
if (existsSync(`${root}.env`)) process.loadEnvFile(`${root}.env`)

const url = process.env.DATABASE_URL
const superAdminId = process.env.PLATFORM_SUPER_ADMIN_ID
if (!url || !superAdminId) {
  console.error('DATABASE_URL and PLATFORM_SUPER_ADMIN_ID must be set; copy .env.example to .env')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
try {
  const result = await seedThemes(sql, await readPalettes(`${root}data/themes`), {
    superAdminId,
    update: process.argv.includes('--update'),
  })
  console.log(`Themes: ${result.added.length} added, ${result.updated.length} updated, ${result.unchanged.length} already present`)
}
catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
finally {
  await sql.end()
}
