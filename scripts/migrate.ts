// Applies pending database migrations: `pnpm db:migrate`.
// Reads DATABASE_URL from the environment, or from .env when present.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'
import { migrate, readMigrations, type MigrationSource } from '../server/database/migrate.ts'

const root = fileURLToPath(new URL('..', import.meta.url))

// Capabilities' own migrations join this list as each is wired in.
const sources: MigrationSource[] = [
  { name: 'app', directory: `${root}server/database/migrations` },
]

if (!process.env.DATABASE_URL && existsSync(`${root}.env`)) {
  process.loadEnvFile(`${root}.env`)
}
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set; copy .env.example to .env')
  process.exit(1)
}

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} })
try {
  const result = await migrate(sql, await readMigrations(sources), console.log)
  console.log(`${result.applied.length} applied, ${result.skipped.length} already applied`)
}
catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
finally {
  await sql.end()
}
