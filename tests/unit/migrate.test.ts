import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import postgres, { type Sql } from 'postgres'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate, readMigrations, type MigrationSource } from '../../server/database/migrate'

const url = process.env.DATABASE_URL

describe('readMigrations', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'migrations-'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  it('reads files in name order, prefixed with their source', async () => {
    await writeFile(join(directory, '0002_second.sql'), 'select 2;')
    await writeFile(join(directory, '0001_first.sql'), 'select 1;')
    await writeFile(join(directory, 'README.md'), '# Not a migration')
    const migrations = await readMigrations([{ name: 'app', directory }])
    expect(migrations.map(m => m.id)).toEqual(['app/0001_first.sql', 'app/0002_second.sql'])
  })

  it('rejects a badly named file', async () => {
    await writeFile(join(directory, 'first.sql'), 'select 1;')
    await expect(readMigrations([{ name: 'app', directory }])).rejects.toThrow(/NNNN_lower_snake_case/)
  })
})

// Needs PostgreSQL: CI provides it; locally run `pnpm db:up` and set DATABASE_URL.
describe.skipIf(!url)('migrate', () => {
  const admin = url ? postgres(url, { max: 1, onnotice: () => {} }) : (undefined as unknown as Sql)
  let schema: string
  let sql: Sql
  let directory: string
  let sources: MigrationSource[]

  beforeEach(async () => {
    schema = `test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
    await admin.unsafe(`create schema ${schema}`)
    sql = postgres(url!, { prepare: false, max: 4, onnotice: () => {}, connection: { search_path: schema } })
    directory = await mkdtemp(join(tmpdir(), 'migrations-'))
    sources = [{ name: 'app', directory }]
  })

  afterEach(async () => {
    await sql.end()
    await admin.unsafe(`drop schema ${schema} cascade`)
    await rm(directory, { recursive: true, force: true })
  })

  afterAll(async () => {
    await admin.end()
  })

  async function tables() {
    const rows = await sql<{ name: string }[]>`
      select table_name as name from information_schema.tables where table_schema = ${schema} order by 1
    `
    return rows.map(row => row.name)
  }

  it('applies pending migrations in order and records them', async () => {
    await writeFile(join(directory, '0001_notes.sql'), 'create table notes (id int primary key);')
    await writeFile(join(directory, '0002_note_text.sql'), 'alter table notes add column body text; insert into notes values (1, $$a; b$$);')
    const result = await migrate(sql, await readMigrations(sources))
    expect(result.applied).toEqual(['app/0001_notes.sql', 'app/0002_note_text.sql'])
    expect(await tables()).toEqual(['notes', 'schema_migrations'])
    const [note] = await sql`select body from notes`
    expect(note!.body).toBe('a; b')
  })

  it('skips migrations already applied', async () => {
    await writeFile(join(directory, '0001_notes.sql'), 'create table notes (id int);')
    await migrate(sql, await readMigrations(sources))
    await writeFile(join(directory, '0002_more.sql'), 'create table more (id int);')
    const result = await migrate(sql, await readMigrations(sources))
    expect(result).toEqual({ applied: ['app/0002_more.sql'], skipped: ['app/0001_notes.sql'] })
  })

  it('refuses an applied migration whose file has changed', async () => {
    await writeFile(join(directory, '0001_notes.sql'), 'create table notes (id int);')
    await migrate(sql, await readMigrations(sources))
    await writeFile(join(directory, '0001_notes.sql'), 'create table notes (id bigint);')
    await expect(migrate(sql, await readMigrations(sources))).rejects.toThrow(/has changed/)
  })

  it('rolls back a failing migration completely and stops', async () => {
    await writeFile(join(directory, '0001_good.sql'), 'create table good (id int);')
    await writeFile(join(directory, '0002_bad.sql'), 'create table half (id int); select * from missing;')
    await writeFile(join(directory, '0003_later.sql'), 'create table later (id int);')
    await expect(migrate(sql, await readMigrations(sources))).rejects.toThrow(/missing/)
    expect(await tables()).toEqual(['good', 'schema_migrations'])
    const applied = await sql`select id from schema_migrations`
    expect(applied.map(row => row.id)).toEqual(['app/0001_good.sql'])
  })

  it('applies each migration once when runs overlap', async () => {
    await writeFile(join(directory, '0001_counter.sql'), 'create table counter (n int); insert into counter values (1);')
    const migrations = await readMigrations(sources)
    const results = await Promise.all([migrate(sql, migrations), migrate(sql, migrations), migrate(sql, migrations)])
    expect(results.flatMap(result => result.applied)).toEqual(['app/0001_counter.sql'])
    const rows = await sql`select n from counter`
    expect(rows).toHaveLength(1)
  })
})
