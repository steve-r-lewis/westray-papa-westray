# Westray-Papa-Westray

> **AI-Driven Development**
>
> Part of [Nuxt 4 Layers](https://github.com/nuxt4-layers), an experimental, AI-driven software engineering initiative. AI performs the principal engineering work under human direction; the project owner decides requirements, acceptance and releases. See [AI Development](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/AI_DEVELOPMENT.md).

> **In short:** the community website for Westray and Papa Westray, in Orkney: island news, what's on, clubs and businesses, a noticeboard and, later, a social feed and a marketplace. It is also the reference application for the `nuxt4-layers` platform.

## Status

**Slice 1a built:** the application shell (header, side menu and footer, laid out after the `westray.uk` mock-up), with every label and link read from [`data/shell.json`](data/shell.json), and the migration runner. Every page beyond the home page says "coming soon". See the [design](docs/design.md).

## What it offers

| Area | For | Slice |
|---|---|---|
| Information, news and what's on | Everyone | 1 |
| Accounts and profiles | Members | 1 |
| Clubs, committees, organisations and businesses, with their own administration | Members and group administrators | 2 |
| Noticeboard, moderated | Members | 3 |
| Group themes and personal choice of look | Groups and members | 4 |
| Social feed and polls | Members | 5 |
| Marketplace and shops | Members and businesses | 6 |
| Workshop booking | Members | 7 |

Pages whose slice is not built yet say "coming soon"; nothing is mocked.

## How it is built

Westray-Papa-Westray draws every screen itself and composes headless `nuxt4-layers` capabilities, pinned by tag ([ADR-0009](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/docs/decisions/ADR-0009-headless-capability-layers.md)).

| Capability | Gives Westray-Papa-Westray |
|---|---|
| [`authentication`](https://github.com/nuxt4-layers/authentication) | Sign-in, sessions, step-up |
| [`identity`](https://github.com/nuxt4-layers/identity) | Accounts, groups and memberships |
| [`profile`](https://github.com/nuxt4-layers/profile) | People's own details, under their control |
| [`authorisation`](https://github.com/nuxt4-layers/authorisation) | Roles and access decisions |
| [`publisher`](https://github.com/nuxt4-layers/publisher) | Pages, articles, events and notices |
| [`configuration`](https://github.com/nuxt4-layers/configuration) | Site facts, contact details and links |
| [`theme-manager`](https://github.com/nuxt4-layers/theme-manager) | Themes, light and dark mode |

Everything a visitor reads is data: text, menus, themes and settings come from these capabilities, never from code.

## Running it

| Where | With |
|---|---|
| Locally | Nuxt 4, pnpm and PostgreSQL 16 |
| Live | Vercel, with Supabase as plain PostgreSQL, both in the UK |

Needs Node 22.18 or later, pnpm 12 and Docker for the local database. pnpm refuses packages published less than a day ago (`minimumReleaseAge` in `pnpm-workspace.yaml`), so the lockfile never holds one.

```sh
npm install --global pnpm@12   # once; corepack cannot run pnpm 12
pnpm install
cp .env.example .env
pnpm db:up        # PostgreSQL 16 in a container
pnpm db:migrate   # apply pending migrations
pnpm dev          # http://localhost:3000
```

| Command | Does |
|---|---|
| `pnpm typecheck` | Type-checks the app, server, tests and scripts |
| `pnpm test` | Unit and component tests; the migration tests run when `DATABASE_URL` is set |
| `pnpm build` | Production build |
| `pnpm db:down` | Stops the local database, keeping its data |

Migration rules are in [the migrations folder](server/database/migrations/README.md).

## Where things are

| Path | Holds |
|---|---|
| `data/shell.json` | Site name, labels, menus, footer, home page text and the pages still to come. Configuration and Publisher replace it in slice 1b |
| `shared/shell.ts` | The schema that data must meet |
| `app/` | Layout, components and pages |
| `server/api/shell.get.ts` | Serves the shell data through a port that slice 1b re-points |
| `server/database/` | Migration runner and migrations |

## Documents

- [Design](docs/design.md): site map, slices, themes, deployment, later stores and legal duties
- [Platform architecture](https://github.com/nuxt4-layers/platform-architecture/tree/b3ef6dd53faa097d7a6b509ec714ea7e447b3051): the rules every layer follows

## Licence

[MIT](LICENSE)
