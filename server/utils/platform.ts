// The platform as `pnpm db:seed` provisioned it in Identity (server/database/
// seed-platform.ts): the tenant everyone signs up into, the platform super admin and
// the platform group they own, which owns the site's content, themes and settings.
// Null until the seed has run, or without a database; then sign-up is refused and
// every access rule refuses, as nobody can hold a role in a group that does not exist.

export interface Platform {
  tenantId: string
  superAdminId: string
  platformGroupId: string
}

let platform: Platform | null = null

export async function readPlatform(): Promise<Platform | null> {
  if (platform) return platform
  const sql = useDatabase()
  if (!sql) return null
  const [row] = await sql<{ tenant_id: string, super_admin_id: string | null, platform_group_id: string | null }[]>`
    select tenant_id, super_admin_id, platform_group_id from platform
  `
  if (!row?.super_admin_id || !row.platform_group_id) return null
  platform = { tenantId: row.tenant_id, superAdminId: row.super_admin_id, platformGroupId: row.platform_group_id }
  return platform
}
