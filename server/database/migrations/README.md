# Migrations

Plain SQL files applied in name order by `pnpm db:migrate`, each in its own transaction.

| Rule | Why |
|---|---|
| Name files `NNNN_lower_snake_case.sql`, e.g. `0001_create_notices.sql` | Order is the file name |
| Never edit an applied file; add a new one | The runner refuses a file whose checksum changed |
| No `begin` or `commit` in a file, and nothing that cannot run in a transaction, such as `create index concurrently` | The runner wraps each file in a transaction |
| Statements only, no parameters | Files run through the simple query protocol, which the transaction pooler needs |

Capabilities ship their own migrations; `scripts/migrate.ts` lists each source, and every applied file is recorded in `schema_migrations` as `source/file`.
