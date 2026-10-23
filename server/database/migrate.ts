import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Sql } from 'postgres'

// Applies plain SQL migrations in order, each in its own transaction.
// Works through Supabase's transaction pooler: it takes only transaction-scoped
// locks and needs no prepared statements, so `postgres(url, { prepare: false })` is enough.

export interface MigrationSource {
  // Prefix recorded with each file, so capabilities' migrations never collide with ours.
  name: string
  directory: string
}

export interface Migration {
  id: string
  sql: string
  checksum: string
}

export interface MigrateResult {
  applied: string[]
  skipped: string[]
}

const fileName = /^\d{4}_[a-z0-9_]+\.sql$/
// Any constant shared by every runner; serialises concurrent deploys.
const lockKey = 7_365_102_119

export async function readMigrations(sources: MigrationSource[]): Promise<Migration[]> {
  const migrations: Migration[] = []
  for (const source of sources) {
    const files = (await readdir(source.directory)).filter(file => file.endsWith('.sql')).sort()
    for (const file of files) {
      if (!fileName.test(file)) {
        throw new Error(`${source.name}/${file}: migration files are named NNNN_lower_snake_case.sql`)
      }
      const sql = await readFile(join(source.directory, file), 'utf8')
      migrations.push({ id: `${source.name}/${file}`, sql, checksum: checksum(sql) })
    }
  }
  return migrations
}

export async function migrate(
  sql: Sql,
  migrations: Migration[],
  log: (message: string) => void = () => {},
): Promise<MigrateResult> {
  const result: MigrateResult = { applied: [], skipped: [] }

  for (const migration of migrations) {
    await sql.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(${lockKey})`
      await tx`
        create table if not exists schema_migrations (
          id text primary key,
          checksum text not null,
          applied_at timestamptz not null default now()
        )
      `
      const [existing] = await tx<{ checksum: string }[]>`
        select checksum from schema_migrations where id = ${migration.id}
      `
      if (existing) {
        if (existing.checksum !== migration.checksum) {
          throw new Error(`${migration.id} has changed since it was applied; add a new migration instead`)
        }
        result.skipped.push(migration.id)
        return
      }
      await tx.unsafe(migration.sql).simple()
      await tx`insert into schema_migrations (id, checksum) values (${migration.id}, ${migration.checksum})`
      result.applied.push(migration.id)
      log(`applied ${migration.id}`)
    })
  }

  return result
}

function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex')
}
