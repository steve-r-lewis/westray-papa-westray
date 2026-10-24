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

## Installation

These steps take a new machine to the site running at `http://localhost:3000`. Commands are shown for PowerShell on Windows and for a shell on macOS or Linux where they differ.

### 1. Install the prerequisites

| Tool | Version | Check with | Why |
|---|---|---|---|
| [Git](https://git-scm.com/downloads) | Any recent | `git --version` | To clone the repository |
| [Node.js](https://nodejs.org/) | 22.18 or later (22 LTS recommended) | `node --version` | Runs Nuxt; 22.18 is the first to run the TypeScript migration script directly |
| [Docker](https://docs.docker.com/get-started/get-docker/) with Compose v2 (Docker Desktop on Windows and macOS) | Any recent | `docker compose version` | Runs the local PostgreSQL 16. Not needed if you already have PostgreSQL 16; see step 5 |

pnpm itself is not installed by hand: corepack downloads the exact version that `package.json` pins (12.5.1) and checks it against the hash there.

### 2. Upgrade corepack and enable it

The corepack bundled with Node 22 is 0.34, which cannot run pnpm 11 or later. Install 0.36.0, then let it provide the `pnpm` command:

```sh
npm install --global corepack@0.36.0
corepack enable
corepack --version   # must print 0.36.0
```

On Windows, run `corepack enable` from a terminal opened with **Run as administrator** if Node is installed under `C:\Program Files`, because it writes the `pnpm` command there. If `corepack --version` still prints 0.34, see [Troubleshooting](#troubleshooting).

### 3. Clone the repository

```sh
git clone https://github.com/steve-r-lewis/westray-papa-westray.git
cd westray-papa-westray
pnpm --version   # must print 12.5.1; corepack may ask once to download it
```

### 4. Install the dependencies

```sh
pnpm install
```

This also runs `nuxt prepare`, which generates the `.nuxt` types. pnpm refuses any package published less than a day ago (`minimumReleaseAge` in `pnpm-workspace.yaml`), so the committed lockfile never holds one. Run `pnpm install` again after every pull that changes `package.json` or `pnpm-lock.yaml`.

### 5. Configure the environment

Copy the example environment file. It is ignored by Git; never commit a real `.env`.

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

```sh
# macOS or Linux
cp .env.example .env
```

It holds one setting:

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgres://westray:westray@localhost:5432/westray` | The PostgreSQL database the migrations run against. The default matches the container in `compose.yaml` |

To use a PostgreSQL 16 you already run instead of Docker, create a database and a user for it, and point `DATABASE_URL` at them. Then skip `pnpm db:up` below.

### 6. Start the database and apply the migrations

```sh
pnpm db:up        # starts PostgreSQL 16 in Docker, listening on 127.0.0.1:5432 only
pnpm db:migrate   # applies pending migrations; prints how many were applied
```

The data lives in the Docker volume `postgres-data`, so it survives restarts. Migration rules are in [the migrations folder](server/database/migrations/README.md).

### 7. Run the site

```sh
pnpm dev
```

Open `http://localhost:3000`. You should see the header, the "Welcome to Westray's Digital Commons" banner and the footer; the menu button opens the side menu, and every page but the home page says "Coming soon". Stop the server with Ctrl+C.

### 8. Check the installation

```sh
pnpm typecheck   # type-checks the app, server, tests and scripts
pnpm test        # unit and component tests
pnpm build       # production build into .output/
```

`pnpm test` skips the migration runner's database tests unless `DATABASE_URL` is set in the shell, because tests do not read `.env`. To include them:

```powershell
# Windows (PowerShell)
$env:DATABASE_URL = "postgres://westray:westray@localhost:5432/westray"
pnpm test
```

```sh
# macOS or Linux
DATABASE_URL=postgres://westray:westray@localhost:5432/westray pnpm test
```

All tests should pass. CI runs these same checks on every pull request.

### Everyday commands

| Command | Does |
|---|---|
| `pnpm dev` | Development server with hot reload at `http://localhost:3000` |
| `pnpm typecheck` | Type-checks the app, server, tests and scripts |
| `pnpm test` | Unit and component tests; the migration tests run when `DATABASE_URL` is set |
| `pnpm build` | Production build into `.output/` |
| `pnpm preview` | Serves the production build locally |
| `pnpm db:up` | Starts the local database |
| `pnpm db:migrate` | Applies pending migrations |
| `pnpm db:down` | Stops the local database, keeping its data |
| `docker compose down --volumes` | Stops the local database and **deletes its data**, for a clean start |

### Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Cannot find module …/pnpm/12.5.1/bin/pnpm.cjs` | An old corepack (0.34 or earlier) is running. Upgrade as in step 2. If an earlier attempt left a broken download, delete the `pnpm/12.5.1` folder in corepack's cache (`%LOCALAPPDATA%\node\corepack\v1` on Windows, `~/.cache/node/corepack/v1` elsewhere) and try again |
| `corepack --version` still prints 0.34 after step 2 | The bundled corepack comes first on `PATH`. Find both with `where.exe corepack` (Windows) or `which -a corepack`. Run `corepack disable` with the old one, then `corepack enable` with the new one, from an administrator terminal on Windows |
| `pnpm --version` prints something other than 12.5.1 | A separately installed pnpm comes first on `PATH`. Remove it, or call `corepack pnpm` instead of `pnpm` |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | The lockfile holds a package published less than a day ago. Pull the latest `master`; if it persists, report it rather than relaxing the rule |
| `Command "nuxt" not found` or `Command "dev" not found` | Your `package.json` is not the repository's, often after an editor's project wizard rewrote it. Check with `git status`, restore it with `git restore package.json pnpm-lock.yaml`, then run `pnpm install` |
| `ERR_PNPM_IGNORED_BUILDS` | A new dependency wants to run an install script. Add it under `allowBuilds` in `pnpm-workspace.yaml` only if you trust it |
| `DATABASE_URL is not set` | Step 5 was skipped: copy `.env.example` to `.env` |
| `ECONNREFUSED 127.0.0.1:5432` | The database is not running: `pnpm db:up`, and check Docker Desktop is started |
| `pnpm db:up` says port 5432 is already allocated | Another PostgreSQL is using the port. Stop it, or change the left-hand port in `compose.yaml` and in `DATABASE_URL` to match, such as `5433` |
| Port 3000 is in use | Run `pnpm dev --port 3001` |

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
