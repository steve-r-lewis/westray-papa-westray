import { randomUUID } from 'node:crypto'
import type pg from 'pg'
import type { Sql } from 'postgres'
import { readFile } from 'node:fs/promises'
// Identity's server functions, outside Nitro, as server/database/seed-content.ts reaches
// Publisher's: by path, from the one installed copy.
import {
  provideIdentityDatabase,
  provideIdentityPolicy,
} from '../../node_modules/@nuxt4-layers/identity/server/utils/identity-composition.ts'
import {
  bootstrapIdentityRootGroup,
  getIdentityProvisioning,
  migrateIdentityDatabase,
  provisionIdentityTenant,
} from '../../node_modules/@nuxt4-layers/identity/server/utils/identity-server.ts'
import { ensureRuntimeRole, type RuntimeRole } from './runtime-role.ts'

// Provisions the platform in Identity, once, as its operator: the tenant everyone
// signs up into, the platform super admin and the platform group they found. Identity
// issues every identifier itself and takes none from outside, so the super admin is
// Identity's identity for the provisioning request PLATFORM_SUPER_ADMIN_ID (reserving
// is idempotent by request), and the site records what Identity issued in its own
// `platform` table. Each step is skipped once done, so the seed may run again.

export interface PlatformFile {
  tenant: { externalId: string, jurisdiction: string, dataRegion: string }
  platformGroup: { name: string }
}

export interface Platform {
  tenantId: string
  superAdminId: string
  platformGroupId: string
}

interface PlatformRow {
  tenant_id: string
  super_admin_request_id: string | null
  super_admin_id: string | null
  platform_group_id: string | null
}

export async function readPlatformFile(file: string): Promise<PlatformFile> {
  return JSON.parse(await readFile(file, 'utf8')) as PlatformFile
}

/** Creates the runtime role and applies Identity's migrations, as the owner. Identity's first. */
export async function migrateIdentity(sql: Sql, owner: pg.Pool, role: RuntimeRole): Promise<void> {
  await ensureRuntimeRole(sql, role)
  await migrateIdentityDatabase({ pool: owner, runtimeRole: role.name })
}

export async function seedPlatform(
  sql: Sql,
  pools: { owner: pg.Pool, runtime: pg.Pool },
  input: { platform: PlatformFile, superAdminRequestId: string },
): Promise<{ platform: Platform, provisioned: string[] }> {
  const provisioned: string[] = []
  const correlationId = randomUUID()
  provideIdentityDatabase({ dialect: 'postgres', pool: pools.runtime })

  let [row] = await sql<PlatformRow[]>`select tenant_id, super_admin_request_id, super_admin_id, platform_group_id from platform`
  if (!row) {
    provideIdentityPolicy({})
    const { tenantId } = await provisionIdentityTenant({ pool: pools.owner, ...input.platform.tenant, correlationId })
    ;[row] = await sql<PlatformRow[]>`insert into platform (tenant_id) values (${tenantId}) returning tenant_id, super_admin_request_id, super_admin_id, platform_group_id`
    provisioned.push('tenant')
  }
  provideIdentityPolicy({ defaultHomeTenantId: row!.tenant_id })

  if (row!.super_admin_request_id && row!.super_admin_request_id !== input.superAdminRequestId) {
    throw new Error('PLATFORM_SUPER_ADMIN_ID differs from the request the platform super admin was provisioned by; it cannot change once seeded.')
  }
  if (!row!.super_admin_id) {
    const provisioning = getIdentityProvisioning()
    const { identityId } = await provisioning.reserve({ requestId: input.superAdminRequestId, kind: 'person', homeTenantId: row!.tenant_id, correlationId })
    await provisioning.confirm({ identityId, correlationId })
    ;[row] = await sql<PlatformRow[]>`
      update platform set super_admin_request_id = ${input.superAdminRequestId}, super_admin_id = ${identityId}, updated_at = now()
      returning tenant_id, super_admin_request_id, super_admin_id, platform_group_id
    `
    provisioned.push('super admin')
  }

  if (!row!.platform_group_id) {
    const { groupId } = await bootstrapIdentityRootGroup({
      pool: pools.owner,
      tenantId: row!.tenant_id,
      name: input.platform.platformGroup.name,
      firstOwnerId: row!.super_admin_id!,
      correlationId,
    })
    ;[row] = await sql<PlatformRow[]>`
      update platform set platform_group_id = ${groupId}, updated_at = now()
      returning tenant_id, super_admin_request_id, super_admin_id, platform_group_id
    `
    provisioned.push('platform group')
  }

  return {
    platform: { tenantId: row!.tenant_id, superAdminId: row!.super_admin_id!, platformGroupId: row!.platform_group_id! },
    provisioned,
  }
}
