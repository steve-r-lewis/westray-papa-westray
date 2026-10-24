import pg from 'pg'
import postgres, { type Sql } from 'postgres'

let connection: Sql | null | undefined

// The application's PostgreSQL connection, or null when DATABASE_URL is not set,
// in which case features that need storage run without it (Theme Manager falls back
// to its built-in default theme). Prepared statements stay off for Supabase's
// transaction pooler.
export function useDatabase(): Sql | null {
  if (connection === undefined) {
    const url = process.env.DATABASE_URL
    connection = url ? postgres(url, { prepare: false, max: 5, onnotice: () => {} }) : null
  }
  return connection
}

let pool: pg.Pool | null | undefined

// A node-postgres pool on the same database, for the layers whose ports expect one
// (Configuration, and Publisher next). Null without DATABASE_URL.
export function useDatabasePool(): pg.Pool | null {
  if (pool === undefined) {
    const url = process.env.DATABASE_URL
    pool = url ? new pg.Pool({ connectionString: url, max: 5 }) : null
  }
  return pool
}
