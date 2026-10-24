# Westray-Papa-Westray

> **AI-Driven Development**
>
> Part of [Nuxt 4 Layers](https://github.com/nuxt4-layers), an experimental, AI-driven software engineering initiative. AI performs the principal engineering work under human direction; the project owner decides requirements, acceptance and releases. See [AI Development](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/AI_DEVELOPMENT.md).

> **In short:** the community website for Westray and Papa Westray, in Orkney: island news, what's on, clubs and businesses, a noticeboard and, later, a social feed and a marketplace. It is also the reference application for the `nuxt4-layers` platform.

## Status

**Slice 1c part 1 built:** on top of slice 1a's shell, themes and migration runner and slice 1b's facts and content, people can create an account, sign in with a second step, and see and change their account, security and own profile, through the IAM suite (Authentication, Identity, Profile and Authorisation). Part 2 adds the members' area: the members' notices, for signed-in members only. Editing on the site waits for the content-editor layer.

| Part | State |
|---|---|
| Home page | A panelled dashboard, after the mock-up: a panel for each section and for the noticeboard, photo of the week and poll. The What's on and News panels list the next events and the newest news from Publisher; the rest say what is coming until their slice fills them |
| Header and footer | The header links to the sections and holds Appearance (palette and colour mode) and Sign in, or Account once signed in; every label and link is read from [`data/shell.json`](data/shell.json); responsive from phone to desktop |
| Side menu | For signed-in members, once their second step is done: their account, profile and security, and the members' notices |
| Members' area | `/members`: the published members' notices, drawn by the site's own components, for signed-in members only (`server/api/members/notices.get.ts`). Nothing serves one to anyone signed out; they have no address and no feed |
| Accounts | Sign in (password and a second step, or a passkey), create an account (confirmed by email), forgotten and new passwords; the account (its state, groups, pausing and closing it), security (password, authenticator app and backup codes, passkeys, where you are signed in) and the person's own profile (names and contact details, who sees each, how they are shown). Every member signs in with a second step. Drawn by the site's own components from [Authentication](https://github.com/nuxt4-layers/authentication/tree/v1.0.0), [Identity](https://github.com/nuxt4-layers/identity/tree/v1.0.0), [Profile](https://github.com/nuxt4-layers/profile/tree/v1.1.0) and [Authorisation](https://github.com/nuxt4-layers/authorisation/tree/v1.0.0) |
| Access | Changes to content, themes and the site's settings ask Authorisation, which grants them only through a role in the platform group. Its one member is the platform super admin, who cannot sign in until part 2, so every change is still refused and nothing is edited on the site |
| Site facts | The name, tagline, locale, default theme, title template, description, social links, the organisation (Westray Digital Access Group) and its contacts come from [Configuration](https://github.com/nuxt4-layers/configuration/tree/v1.2.0), set in `data/configuration.json` |
| Content | Pages, articles, blog posts, events, workshops and Creative Trail stops are [Publisher](https://github.com/nuxt4-layers/publisher/tree/v1.0.0) documents, drawn by the site's own components. Nobody can change them on the site until slice 1c part 2: they are seeded from `data/content/` |
| Information pages | About and Policies (text from the mock-up), and Contact, which lists the general, data-protection and security contacts. A contact form waits for an enquiry capability |
| News and What's on | Section pages for News, Articles, Blog, What's on, Events, Workshops and the Creative Trail list published documents, with RSS and Atom feeds. The real site starts empty |
| For machines | `sitemap.xml`, `robots.txt` and `.well-known/security.txt` (RFC 9116, from Configuration's `contact.security`) |
| Demonstration | A separate pre-launch deployment can run with invented content, a banner on every page and nothing indexed; see [Demonstration deployment](#demonstration-deployment) |
| Themes | Four seasonal palettes (Spring, Summer, Autumn and Winter) stored by [Theme Manager](https://github.com/nuxt4-layers/theme-manager/tree/v0.2.2), meeting WCAG 2.2 AA contrast in light and dark; visitors choose a palette and a colour mode |
| Pages still to come | Community and Market say "coming soon" |

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
| [`authentication`](https://github.com/nuxt4-layers/authentication/tree/v1.0.0) | Sign-in, sessions, second steps and step-up. Composed now, at its `v1.0.0` commit |
| [`identity`](https://github.com/nuxt4-layers/identity/tree/v1.0.0) | Identities, groups and memberships. Composed now, at its `v1.0.0` commit |
| [`profile`](https://github.com/nuxt4-layers/profile/tree/v1.1.0) | People's own details, under their control. Composed now, at its `v1.1.0` commit |
| [`authorisation`](https://github.com/nuxt4-layers/authorisation/tree/v1.0.0) | Roles and access decisions. Composed now, at its `v1.0.0` commit |
| [`iam-integration`](https://github.com/nuxt4-layers/iam-integration/tree/v1.1.0) | The reference adapters joining the four above, as their operations guide asks. Composed now, at its `v1.1.0` commit |
| [`publisher`](https://github.com/nuxt4-layers/publisher/tree/v1.0.0) | Pages, articles, events and notices. Composed now, at its `v1.0.0` commit |
| [`configuration`](https://github.com/nuxt4-layers/configuration/tree/v1.2.0) | Site facts, contact details and links. Composed now, at its `v1.2.0` commit |
| [`theme-manager`](https://github.com/nuxt4-layers/theme-manager/tree/v0.2.2) | Themes, light and dark mode. Composed now, at its `v0.2.2` commit |

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

It holds these settings:

| Variable | Default | Meaning |
|---|---|---|
| `DATABASE_URL` | `postgres://westray-papa-westray:westray-papa-westray@localhost:5432/westray-papa-westray` | The PostgreSQL database the site, migrations and seeding use; required. The default matches the container in `compose.yaml` |
| `DATABASE_RUNTIME_URL` | `postgres://westray_runtime:westray_runtime@localhost:5432/westray-papa-westray` | The same database as the role Identity and Profile serve requests as: one that owns nothing and cannot bypass their row-level security, named as a plain lower-case identifier. `pnpm db:seed` and the site create it as `DATABASE_URL`'s role, which therefore needs `CREATEROLE` (the container's user and Supabase's `postgres` have it) |
| `PLATFORM_SUPER_ADMIN_ID` | `01900000-0000-7000-8000-000000000001` | The provisioning request (a UUIDv7) by which `pnpm db:seed` has Identity issue the platform super admin. Identity issues every identifier itself, so the seed records the super admin's identity id; the example themes belong to it, and it owns the platform group. Fixed once seeded |
| `NUXT_AUTHENTICATION_SECRET` | A value for this machine only | Authentication's signing and encryption secret, at least 32 random bytes; every deployment has its own, from its secret store |
| `NUXT_AUTHENTICATION_BASE_URL`, `NUXT_IDENTITY_BASE_URL`, `NUXT_PROFILE_BASE_URL`, `NUXT_AUTHORISATION_BASE_URL` | `http://localhost:3000` | The site's public origin, which each IAM layer checks every change against; `https` everywhere but on a developer's machine |
| `PROFILE_KEYS`, `PROFILE_KEY_VERSION` | A key for this machine only, `dev-1` | Profile's master keys, which wrap each person's own data key: `version=key` pairs (32 random bytes in base64, separated by commas) and the version new keys are wrapped with. A deployment keeps its own in its secret store |
| `MAIL_TRANSPORT` | `directory` | How the site's email leaves: `directory` writes each message as a JSON file in `MAIL_DIRECTORY`, for this machine and the tests; `smtp` sends it through `SMTP_URL`. Without one, nobody can confirm an address |
| `MAIL_DIRECTORY` | `.mail` | Where `directory` mail is written: open the newest file there for a confirmation or reset link |
| `MAIL_FROM`, `SMTP_URL` | empty | For `smtp`: the sender's address, and the server as `smtps://user:password@host:465` |
| `DEMO_MODE` | `false` | `true` only on the separate demonstration deployment: see [Demonstration deployment](#demonstration-deployment) |
| `DEMO_LAUNCH_DATE` | empty | The real site's launch date (`YYYY-MM-DD`) for the demonstration's banner; empty while it is to be announced |

To use a PostgreSQL 16 you already run instead of Docker, create a database and a user for it, and point `DATABASE_URL` at them. Then skip `pnpm db:up` below.

### 6. Start the database, apply the migrations and seed it

```sh
pnpm db:up        # starts PostgreSQL 16 in Docker, listening on 127.0.0.1:5432 only
pnpm db:migrate   # applies pending migrations; prints how many were applied
pnpm db:seed      # provisions the platform in Identity, then loads the four example themes and the information pages
```

The data lives in the Docker volume `postgres-data`, so it survives restarts. Migration rules are in [the migrations folder](server/database/migrations/README.md).

Seeding first creates the runtime role and applies Identity's migrations, then provisions the platform in Identity, once: the tenant everyone signs up into, the platform super admin and the platform group they own (`data/platform.json`), recorded in the site's `platform` table. Seeding adds anything missing and leaves what is already stored alone, so it is safe to run again. `pnpm db:seed --update` overwrites the seeded themes with the versions in `data/themes/`, and saves any page whose file in `data/content/` has changed as a new Publisher version, publishing it if the page is published, so its history is kept. Publisher, Configuration and the IAM layers create and migrate their own schemas (`publisher`, `configuration`, `authentication`, `identity`, `profile`, `authorisation`) when the site starts; seeding migrates Identity's and Publisher's first.

### 7. Run the site

```sh
pnpm dev
```

Open `http://localhost:3000`. You should see the site in its Spring palette: the header with the section links, Appearance and Sign in, the "Welcome to Westray's Digital Commons" banner, and the dashboard's panels. Appearance opens the palette picker and the System, Light and Dark switch. The footer's About, Contact and Policies pages show their text; News and What's on say there is nothing yet, because the real site starts empty (seed the [demonstration content](#demonstration-deployment) to see them filled). Community and Market say "Coming soon". Sign in, then Create an account: the confirmation link arrives as the newest file in `.mail/`. Follow it, sign in, and set up an authenticator app (or a passkey) as the second step; the side menu then appears, with Account, Profile and Security. Stop the server with Ctrl+C.

If Appearance has no palette picker, the themes are not seeded (step 6) or the database is not running.

### 8. Check the installation

```sh
pnpm typecheck   # type-checks the app, server, tests and scripts
pnpm test        # unit and component tests
pnpm build       # production build into .output/
```

`pnpm test` skips the database tests unless `DATABASE_URL` is set in the shell, because tests do not read `.env`. They include the migration runner's tests and two end-to-end suites, which build the site and run it on databases of their own, created beside `DATABASE_URL`'s and dropped afterwards (so its user must be allowed to create databases, as the container's is):

| Suite | Proves |
|---|---|
| `tests/e2e/leaks.test.ts` | Canary leak tests. Drafts, scheduled and archived documents, a published article's newer draft and a members' notice each carry a unique canary string (`tests/fixtures/canaries/`). Anonymous requests to every page, API, feed, sitemap and error response, found by following every link, must never show one, and a hidden document's address must answer exactly as an address that never held anything. Both hold again for a member who has signed up and in, and holds no role, except that they see the members' notices, in the members' area alone |
| `tests/e2e/accounts.test.ts` | Accounts: a person signs up, confirms their address from the emailed link, signs in with an authenticator app and changes their profile; then no signed-out request to any account page or IAM API, from a browser that never signed in or one just signed out, shows their address, name or identifiers; and a member with no roles changes no theme, setting, document or group |
| `tests/e2e/demo.test.ts` | The demonstration deployment: its banner on every page, `noindex` everywhere, a disallowing `robots.txt`, and the invented content listed |

To include them:

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
| `DATABASE_URL is not set` or `DATABASE_URL, DATABASE_RUNTIME_URL and PLATFORM_SUPER_ADMIN_ID must be set` | Step 5 was skipped, or `.env` predates a setting: copy `.env.example` to `.env` again |
| `permission denied to create role` | `DATABASE_URL`'s role cannot create the runtime role: give it `CREATEROLE`, or create `DATABASE_RUNTIME_URL`'s role yourself (`login`, no other powers) |
| The server logs `The platform is not provisioned`, and creating an account fails | Run `pnpm db:seed`, then restart the site |
| No confirmation email arrives | With `MAIL_TRANSPORT=directory` it is the newest file in `MAIL_DIRECTORY` (`.mail/`); with `smtp`, check `SMTP_URL` and `MAIL_FROM` |
| `PLATFORM_SUPER_ADMIN_ID differs from the request the platform super admin was provisioned by` | The database was seeded with another value. Keep the one it was seeded with, or start a clean database |
| Appearance has no palette picker, and the site is in blue-grey | Theme Manager could not reach stored themes, so its built-in default applies: start the database and run `pnpm db:migrate` and `pnpm db:seed` |
| `password authentication failed for user "westray-papa-westray"` | Your local database was created before the user, password and database were renamed from `westray`; PostgreSQL only sets them when its volume is first created. `pnpm db:up` now makes a fresh volume, as `compose.yaml` fixes the project name; if the old container still holds port 5432, stop it in Docker Desktop or with `docker ps` and `docker stop`, then run `pnpm db:up` and `pnpm db:migrate` again. Remove the old volume when you no longer need it: `docker volume ls` lists it with a `postgres-data` suffix |
| Every page answers 503 | The site cannot reach its database, which Configuration and Publisher need for every page: start it with `pnpm db:up` |
| `ERR_PNPM_EXOTIC_SUBDEP` | A dependency's dependency comes from Git. Publisher takes `rich-text` from GitHub, which `pnpm-workspace.yaml` allows only as the commit its catalog pins; anything else needs a reviewed change there |
| About and Policies say "Page not found" | Their content is not seeded: run `pnpm db:seed` |
| `ECONNREFUSED 127.0.0.1:5432` | The database is not running: `pnpm db:up`, and check Docker Desktop is started |
| `pnpm db:up` says port 5432 is already allocated | Another PostgreSQL is using the port. Stop it, or change the left-hand port in `compose.yaml` and in `DATABASE_URL` to match, such as `5433` |
| Port 3000 is in use | Run `pnpm dev --port 3001` |

## Demonstration deployment

Before launch, a separate deployment shows what the site will be like, filled with invented content. It is the same code with two environment settings; the real deployment leaves both unset.

| Setting | Effect |
|---|---|
| `DEMO_MODE=true` | A banner on every page: "Pre-launch demonstration: everything here is fictitious; launches on [date]; at launch the site starts empty". Every answer carries `X-Robots-Tag: noindex, nofollow`, every page a `robots` meta tag, and `robots.txt` disallows everything. `pnpm db:seed` adds the content in `data/demo/` |
| `DEMO_LAUNCH_DATE=2027-04-01` | The date in the banner; leave it empty for "a date to be announced" |

Both are the application's own Configuration settings (`demo.enabled`, `demo.launch-date`), declared `locked`, so only the deployment sets them and nobody can change them on the site.

The demonstration's groups are invented but based on island life (the craft association, the sailing club, holiday stays), with fictitious people, `01632 960xxx` telephone numbers and `example.org` addresses. Its dates are relative to the day it is seeded: run `pnpm db:seed --update` with `DEMO_MODE=true` to move events and workshops on, or delete and reseed its database to refresh everything. Demonstration content is never loaded without `DEMO_MODE=true`; give the demonstration its own database, never the real site's.

To try it locally, set the variables in the shell rather than in `.env`, which `scripts/provision.ps1` overwrites:

```powershell
# Windows (PowerShell)
$env:DEMO_MODE = "true"
pnpm db:seed
pnpm dev
```

```sh
# macOS or Linux
DEMO_MODE=true pnpm db:seed
DEMO_MODE=true pnpm dev
```

The invented content then stays in your local database; `./scripts/provision.ps1 -ResetData` clears it.

## Where things are

| Path | Holds |
|---|---|
| `data/configuration.json` | The site's facts, as Configuration deployment values: name, tagline, locale, default theme, title template, description, social links, the organisation and its general, data-protection and security contacts. Administrators can override them at the platform scope once editing arrives in slice 1c part 2 |
| `data/platform.json` | The platform as Identity holds it: its tenant's jurisdiction and data region, and the platform group's name |
| `data/content/` | The real site's content, seeded into Publisher: one `.json` per document (type, title, address, dates) with its text beside it in `.md`. Only the information pages; everything else is published on the site from slice 1c part 2 |
| `data/demo/` | Invented content for the demonstration deployment only, with dates relative to the day it is seeded |
| `data/shell.json` | Labels, header links, every word of the sign-in and account pages and of the site's email, the members' side menu, the footer, the home page's text and dashboard panels, the section pages (which types each lists, in which order), the Contact page's role names, the demonstration banner, the theme picker's order and the pages still to come |
| `data/themes/` | The four seasonal palettes, generated by `scripts/themes/generate.ts` |
| `shared/shell.ts`, `shared/icons.ts`, `shared/content.ts`, `shared/account.ts` | The schema that data must meet, the icons it may name, what the screens know of content (the site, the public and listed types, and a listing's cards) and of the IAM suite's vocabulary (refusals, identity states, profile fields) |
| `app/pages/sign-in.vue`, `sign-up.vue`, `forgot-password.vue`, `reset-password.vue`, `app/pages/account/` | The sign-in and account pages, drawn with the site's own components (`AppField`, `AppButton`, `AppNotice`, `AccountSection` and others) over the IAM layers' composables; the layers' own pages are not registered |
| `app/` | Layout, components and pages, styled only with Theme Manager's semantic classes (`bg-fill-*`, `text-pen-*`, `border-edge-*`). `app/components/RichText.vue` draws Publisher's rich-text safe trees, never HTML |
| `server/api/shell.get.ts` | Serves the shell data |
| `server/utils/document-types.ts` | The document types registered with Publisher: page, article, blog post, event, workshop, Creative Trail stop, and the members' notice |
| `server/plugins/iam.ts`, `server/utils/iam.ts` | Composes the IAM suite with iam-integration's adapters: Authentication and Authorisation on `DATABASE_URL`'s pool, Identity and Profile on the runtime role's; the platform from the `platform` table; the outbox relays and maintenance, run every minute and every ten minutes as Nitro tasks (`server/tasks/iam/`), Vercel Cron in production |
| `server/utils/permissions.ts` | Authorisation's catalogue: Identity's, Profile's, Configuration's, Publisher's (`publisher.<type>:<action>`) and Theme Manager's (`themes:<action>`, all `high`) permissions |
| `server/api/members/`, `app/pages/members.vue` | The members' area: the members' notices, for signed-in members only |
| `server/utils/mail.ts` | The site's email: Authentication's messages and Profile's codes, in the shell's words, by SMTP or to a directory |
| `server/database/seed-platform.ts`, `server/database/runtime-role.ts` | Provisioning the platform in Identity, and the runtime role |
| `server/plugins/publisher.ts` | Connects Publisher to the `pg` pool, one site (`westray`), the signed-in person, and access decisions that ask Authorisation, on the platform group (`server/utils/publisher-access.ts`). Publisher's own HTTP API is off |
| `server/api/content/`, `server/routes/` | What anyone may read: an address's published document, a section's listing, feeds, `sitemap.xml`, `robots.txt` and `security.txt` |
| `server/plugins/configuration.ts` | Connects Configuration to PostgreSQL (its own `configuration` schema, migrated at start-up) and supplies the deployment values; its administration asks Identity and Authorisation through Configuration's own adapters, and its pages stay off until slice 1c part 2 |
| `server/plugins/theme-manager.ts` | Connects Theme Manager to PostgreSQL (`server/utils/theme-store.ts`) and to the access policy (`server/utils/theme-policy.ts`): anyone may see and use public themes, and every change asks Authorisation, which no role yet grants |
| `server/database/` | Migration runner, migrations and seeding: themes, and content through Publisher's `importPublisherContent` |
| `tests/e2e/`, `tests/fixtures/canaries/` | The built site's tests, and the hidden content the leak tests look for |

## Documents

- [Plan](docs/plan.md): how we work, what is done and what comes next; read it first
- [Architecture in plain English](docs/architecture.md): what the site is made of, what each part owns and how they fit together
- [Design](docs/design.md): site map, slices, themes, deployment, later stores and legal duties
- [Platform architecture](https://github.com/nuxt4-layers/platform-architecture/tree/b3ef6dd53faa097d7a6b509ec714ea7e447b3051): the rules every layer follows

## Licence

[MIT](LICENSE)
