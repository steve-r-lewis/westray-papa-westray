import type { Sql } from 'postgres'

// The runtime role: the database role Identity and Profile serve requests as. It owns
// nothing, is no superuser and cannot bypass row-level security, as both require; the
// role that owns the database (DATABASE_URL's) migrates their schemas and grants it
// what it needs. Its name and password are DATABASE_RUNTIME_URL's.

export interface RuntimeRole {
  name: string
  password: string
}

/** The role DATABASE_RUNTIME_URL connects as, checked against the owner's. */
export function runtimeRole(runtimeUrl: string, ownerUrl: string): RuntimeRole {
  const runtime = new URL(runtimeUrl)
  const owner = new URL(ownerUrl)
  const name = decodeURIComponent(runtime.username)
  if (!name || !runtime.password) throw new TypeError('DATABASE_RUNTIME_URL must name a role and its password.')
  if (name === decodeURIComponent(owner.username)) {
    throw new TypeError('DATABASE_RUNTIME_URL must connect as a role of its own, not as DATABASE_URL\'s, which owns the schemas.')
  }
  if (runtime.host !== owner.host || runtime.pathname !== owner.pathname) {
    throw new TypeError('DATABASE_RUNTIME_URL must name the same database as DATABASE_URL.')
  }
  return { name, password: decodeURIComponent(runtime.password) }
}

/**
 * Creates the runtime role if it is missing, or sets its password and takes away any
 * power it should not have, and lets it connect. Run as the database's owner, which
 * needs CREATEROLE (as the local container's user and Supabase's `postgres` have).
 */
export async function ensureRuntimeRole(sql: Sql, role: RuntimeRole): Promise<void> {
  // Roles belong to the whole server, so another process may be making the same
  // change at once (several sites starting, or test suites in parallel): try again.
  for (let attempt = 1; ; attempt++) {
    try {
      return await applyRuntimeRole(sql, role)
    }
    catch (error) {
      const code = (error as { code?: string }).code
      if (attempt >= 5 || (code !== 'XX000' && code !== '42710' && code !== '23505')) throw error
      await new Promise(resolve => setTimeout(resolve, 100 * attempt))
    }
  }
}

async function applyRuntimeRole(sql: Sql, role: RuntimeRole): Promise<void> {
  await sql.begin(async (tx) => {
    // Passed as settings, so the name and password are quoted by format(), never spliced.
    await tx`select set_config('wpw.runtime_role', ${role.name}, true), set_config('wpw.runtime_password', ${role.password}, true)`
    await tx.unsafe(`
      do $$
      declare
        v_role text := current_setting('wpw.runtime_role');
        v_password text := current_setting('wpw.runtime_password');
      begin
        if exists (select 1 from pg_roles where rolname = v_role) then
          execute format('alter role %I with login nosuperuser nocreatedb nocreaterole nobypassrls password %L', v_role, v_password);
        else
          execute format('create role %I with login nosuperuser nocreatedb nocreaterole nobypassrls password %L', v_role, v_password);
        end if;
        execute format('grant connect on database %I to %I', current_database(), v_role);
      end $$
    `).simple()
  })
}
