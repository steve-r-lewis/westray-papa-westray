-- Theme Manager's stored Themes. `definition` is the canonical Theme JSON, which
-- Theme Manager validates on every read; the other columns are projections of it
-- for querying and must never be treated as a second Theme Definition.
create table themes (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  definition jsonb not null check (definition ->> 'id' = id),
  owner_type text generated always as (definition -> 'ownership' ->> 'ownerType') stored,
  owner_id text generated always as (definition -> 'ownership' ->> 'ownerId') stored,
  visibility text generated always as (definition ->> 'visibility') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index themes_owner on themes (owner_type, owner_id);
create index themes_visibility on themes (visibility);
