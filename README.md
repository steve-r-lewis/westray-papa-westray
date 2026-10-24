# Westray-Papa-Westray

> **AI-Driven Development**
>
> Part of [Nuxt 4 Layers](https://github.com/nuxt4-layers), an experimental, AI-driven software engineering initiative. AI performs the principal engineering work under human direction; the project owner decides requirements, acceptance and releases. See [AI Development](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/AI_DEVELOPMENT.md).

> **In short:** the community website for Westray and Papa Westray, in Orkney: island news, what's on, clubs and businesses, a noticeboard and, later, a social feed and a marketplace. It is also the reference application for the `nuxt4-layers` platform.

## Status

**Slice 1a built:** the application shell after the `westray.uk` mock-up, the migration runner and seeding, and themes through Theme Manager.

| Part | State |
|---|---|
| Home page | A panelled dashboard, after the mock-up: a panel for each section (What's on, News, Community, Market) and for the noticeboard, photo of the week and poll, each saying what is coming until its slice fills it |
| Header and footer | The header links to the sections and holds Appearance (palette and colour mode) and Sign in; every label and link is read from [`data/shell.json`](data/shell.json); responsive from phone to desktop |
| Side menu | For signed-in members only, so hidden until sign-in arrives with slice 1c |
| Site facts | The name, tagline, locale, default theme, title template, description and social links come from [Configuration](https://github.com/nuxt4-layers/configuration/tree/v1.2.0), set in `data/configuration.json` |
| Themes | Four seasonal palettes (Spring, Summer, Autumn and Winter) stored by [Theme Manager](https://github.com/nuxt4-layers/theme-manager/tree/v0.2.1), meeting WCAG 2.2 AA contrast in light and dark; visitors choose a palette and a colour mode |
| Pages | Every page beyond the home page says "coming soon" |

See the [design](docs/design.md).

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
| [`configuration`](https://github.com/nuxt4-layers/configuration/tree/v1.2.0) | Site facts, contact details and links. Composed now, at its `v1.2.0` commit |
| [`theme-manager`](https://github.com/nuxt4-layers/theme-manager/tree/v0.2.1) | Themes, light and dark mode. Composed now, at its `v0.2.1` commit |

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
| [Node.js](https://nodejs.org/) | 22.18 or later; `.node-version` names the one in use, which `fnm` and similar switch to on entering the folder | `node --version` | Runs Nuxt; 22.18 is the first to run the TypeScript migration script directly |
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

It holds two settings:

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgres://westray-papa-westray:westray-papa-westray@localhost:5432/westray-papa-westray` | The PostgreSQL database the site, migrations and seeding use; required. The default matches the container in `compose.yaml` |
| `PLATFORM_SUPER_ADMIN_ID` | `00000000-0000-4000-8000-000000000001` | The platform super admin's account id. Seeded data, such as the example themes, belongs to this account; Identity creates the account with this id in slice 1c |

To use a PostgreSQL 16 you already run instead of Docker, create a database and a user for it, and point `DATABASE_URL` at them. Then skip `pnpm db:up` below.

### 6. Start the database, apply the migrations and seed it

```sh
pnpm db:up        # starts PostgreSQL 16 in Docker, listening on 127.0.0.1:5432 only
pnpm db:migrate   # applies pending migrations; prints how many were applied
pnpm db:seed      # loads the four example themes; prints how many were added
```

The data lives in the Docker volume `postgres-data`, so it survives restarts. Migration rules are in [the migrations folder](server/database/migrations/README.md).

Seeding adds anything missing and leaves what is already stored alone, so it is safe to run again; `pnpm db:seed --update` overwrites the seeded themes with the versions in `data/themes/`.

### 7. Run the site

```sh
pnpm dev
```

Open `http://localhost:3000`. You should see the site in its Spring palette: the header with the section links, Appearance and Sign in, the "Welcome to Westray's Digital Commons" banner, and the dashboard's panels. Appearance opens the palette picker and the System, Light and Dark switch. Every page but the home page says "Coming soon". There is no side menu yet: it is for signed-in members, and signing in arrives with slice 1c. Stop the server with Ctrl+C.

If Appearance has no palette picker, the themes are not seeded (step 6) or the database is not running.

### 8. Check the installation

```sh
pnpm typecheck   # type-checks the app, server, tests and scripts
pnpm test        # unit and component tests
pnpm build       # production build into .output/
```

`pnpm test` skips the migration runner's database tests unless `DATABASE_URL` is set in the shell, because tests do not read `.env`. To include them:

```powershell
# Windows (PowerShell)
$env:DATABASE_URL = "postgres://westray-papa-westray:westray-papa-westray@localhost:5432/westray-papa-westray"
pnpm test
```

```sh
# macOS or Linux
DATABASE_URL=postgres://westray-papa-westray:westray-papa-westray@localhost:5432/westray-papa-westray pnpm test
```

All tests should pass. CI runs these same checks on every pull request.

### Keeping a test copy in line with GitHub

Development happens on GitHub; a local copy is for testing what is there. After each pull (or `repoRefresh`), one command brings everything else into line:

```powershell
./scripts/provision.ps1           # or repoProvision, with the profile function below
```

It needs PowerShell 7 (on macOS or Linux, `pwsh`). Each step checks first and changes only what is out of date, so it is safe to run every time:

| Step | Does |
|---|---|
| Node | Stops unless Node meets `engines.node` in `package.json` |
| Corepack | Offers to install corepack 0.36.0 if it is missing or older than 0.35, then `corepack enable` if `pnpm` is not the pinned version |
| `.env` | Overwrites it from `.env.example`, so it matches the commit; a previous `.env` that differed is kept as `.env.previous` |
| Docker | When `DATABASE_URL` is the local container, checks Docker is running, and on Windows offers to start Docker Desktop and waits for it |
| Packages | `pnpm install --frozen-lockfile` |
| Database | Starts the container and waits until it is healthy, then `pnpm db:migrate` and `pnpm db:seed --update`, which overwrites seeded rows with the repository's versions |

| Switch | Effect |
|---|---|
| `-Status` | Report every step and change nothing |
| `-DryRun` | Show what each step would do and change nothing |
| `-Check` | Also run the type check and the tests, including the database tests |
| `-ResetData` | Delete the local database and its data first, then rebuild it |
| `-Force` | Answer yes to every question (installing corepack, starting Docker Desktop, deleting data) |
| `-Help` or `/h` | Show the help |

Because `.env` is overwritten, put nothing in it by hand; settings belong in `.env.example`.

To run it as `repoProvision` from anywhere in a repository that has one, add this beside `repoRefresh` in your PowerShell profile:

```powershell
# Runs the current repository's own scripts/provision.ps1, so the steps always match its commit.
function repoProvision {
    $root = git rev-parse --show-toplevel 2>$null
    if (-not $root) { throw 'Not inside a Git repository.' }
    $script = Join-Path $root 'scripts/provision.ps1'
    if (-not (Test-Path -LiteralPath $script -PathType Leaf)) { throw "This repository has no scripts/provision.ps1: $root" }
    # A string '-Help' would arrive as a value, not a switch, so /h calls -Help directly.
    if ($args.Count -gt 0 -and $args[0] -eq '/h') { & $script -Help; return }
    & $script @args
}
```

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
| `pnpm db:seed` | Adds missing seed data; `--update` overwrites it |
| `pnpm themes:generate` | Regenerates the four palettes in `data/themes/` from `scripts/themes/generate.ts`, checking every contrast pair |
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
| `DATABASE_URL is not set` or `PLATFORM_SUPER_ADMIN_ID must be set` | Step 5 was skipped, or `.env` predates the second setting: copy `.env.example` to `.env` again |
| `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` | Theme Manager is installed from GitHub and runs its `prepare` script. `pnpm-workspace.yaml` allows it for the pinned commit only; when the commit in `package.json` changes, change it there too |
| Appearance has no palette picker, and the site is in blue-grey | Theme Manager could not reach stored themes, so its built-in default applies: start the database and run `pnpm db:migrate` and `pnpm db:seed` |
| `password authentication failed for user "westray-papa-westray"` | Your local database was created before the user, password and database were renamed from `westray`; PostgreSQL only sets them when its volume is first created. `pnpm db:up` now makes a fresh volume, as `compose.yaml` fixes the project name; if the old container still holds port 5432, stop it in Docker Desktop or with `docker ps` and `docker stop`, then run `pnpm db:up` and `pnpm db:migrate` again. Remove the old volume when you no longer need it: `docker volume ls` lists it with a `postgres-data` suffix |
| Every page answers 503 | The site cannot reach its database, which Configuration needs for every page: start it with `pnpm db:up` |
| `ECONNREFUSED 127.0.0.1:5432` | The database is not running: `pnpm db:up`, and check Docker Desktop is started |
| `pnpm db:up` says port 5432 is already allocated | Another PostgreSQL is using the port. Stop it, or change the left-hand port in `compose.yaml` and in `DATABASE_URL` to match, such as `5433` |
| Port 3000 is in use | Run `pnpm dev --port 3001` |

## Where things are

| Path | Holds |
|---|---|
| `data/configuration.json` | The site's facts, as Configuration deployment values: name, tagline, locale, default theme, title template, description and social links. Administrators can override them at the platform scope once sign-in arrives in slice 1c |
| `data/shell.json` | Labels, header links, the members' side menu, the footer, the home page's text and dashboard panels, the theme picker's order and the pages still to come. Publisher takes over the content in the rest of slice 1b |
| `data/themes/` | The four seasonal palettes, generated by `scripts/themes/generate.ts` |
| `shared/shell.ts`, `shared/icons.ts` | The schema that data must meet, and the icons it may name |
| `app/` | Layout, components and pages, styled only with Theme Manager's semantic classes (`bg-fill-*`, `text-pen-*`, `border-edge-*`) |
| `server/api/shell.get.ts` | Serves the shell data through a port that slice 1b re-points |
| `server/plugins/configuration.ts` | Connects Configuration to PostgreSQL (its own `configuration` schema, migrated at start-up) and supplies the deployment values; its administration pages stay off until slice 1c |
| `server/plugins/theme-manager.ts` | Connects Theme Manager to PostgreSQL (`server/utils/theme-store.ts`) and to the access policy (`server/utils/theme-policy.ts`): anyone may see and use public themes, and every change is refused until Authorisation arrives in slice 1c |
| `server/database/` | Migration runner, migrations and seeding |

## Documents

- [Design](docs/design.md): site map, slices, themes, deployment, later stores and legal duties
- [Platform architecture](https://github.com/nuxt4-layers/platform-architecture/tree/b3ef6dd53faa097d7a6b509ec714ea7e447b3051): the rules every layer follows

## Licence

[MIT](LICENSE)
