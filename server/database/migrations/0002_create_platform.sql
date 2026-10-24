-- The platform as Identity provisioned it, recorded by `pnpm db:seed`: the tenant
-- everyone signs up into, the platform group whose owners operate the site, and the
-- platform super admin, Identity's identity for the provisioning request
-- PLATFORM_SUPER_ADMIN_ID. Identity issues every identifier itself, so the site keeps
-- them here. One row at most.
create table platform (
  singleton boolean primary key default true check (singleton),
  tenant_id uuid not null,
  super_admin_request_id uuid,
  super_admin_id uuid,
  platform_group_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
