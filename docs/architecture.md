# Westray-Papa-Westray: Architecture in Plain English

> **In short:** what the site is made of today, what each part owns, and how they talk to each other, written for its owner rather than for a programmer. It describes what exists and decides nothing new: decisions are made in the [design](design.md) and listed in the [plan](plan.md#decisions-to-remember).

## The idea in one paragraph

The site is a shell. It draws every page and decides how things look and read, but it owns almost no data. The data, and the rules about it, live in separate building blocks called layers, each built and released on its own in the `nuxt4-layers` organisation. Each layer answers one question and keeps its own tables. Layers never talk to each other directly: the site passes answers between them.

## The picture

```text
                        ┌──────────────────────────────────────────────┐
  A visitor's browser → │  The site (this repository): pages, wording,  │
                        │  wiring between the layers                    │
                        └──────────────────────────────────────────────┘
                           │        │         │          │          │
              what is published  site settings  looks   who signed in  …
                           ▼        ▼         ▼          ▼
                     ┌─────────┐ ┌─────────┐ ┌───────┐ ┌──────────────────────────────┐
                     │Publisher│ │Configur-│ │ Theme │ │ The IAM suite (four layers): │
                     │         │ │ ation   │ │Manager│ │ Authentication, Identity,    │
                     └─────────┘ └─────────┘ └───────┘ │ Profile, Authorisation       │
                                                        └──────────────────────────────┘
                           │        │         │          │
                           ▼        ▼         ▼          ▼
                     ┌──────────────────────────────────────────────┐
                     │  One PostgreSQL database: each layer has its  │
                     │  own section (schema) that no other reads     │
                     └──────────────────────────────────────────────┘
```

## What each part owns

| Part | Answers | Owns | Built by |
|---|---|---|---|
| **The site** | What does a visitor see and read? | Pages and components, every word on screen (`data/shell.json`), the site's facts as first deployed (`data/configuration.json`), the seasonal palettes (`data/themes/`), and a note of the identifiers Identity issued for the platform (the `platform` table) | This repository |
| **Publisher** | What has been published, and where? | Pages, articles, blog posts, events, workshops, Creative Trail stops and members' notices, with their versions and drafts | `nuxt4-layers/publisher` |
| **Configuration** | What are the site's settings? | The site's name, tagline, description, contacts, and later settings for groups and people | `nuxt4-layers/configuration` |
| **Theme Manager** | What does it look like? | Themes (colours, light and dark) and the rules that keep text readable | `nuxt4-layers/theme-manager` |
| **Authentication** | Who has signed in, and how surely? | Email addresses used to sign in, passwords, authenticator apps, passkeys, sessions | `nuxt4-layers/authentication` |
| **Identity** | Which person or group is this, and who belongs to what? | People's and groups' identifiers, groups (a club, a committee, the platform's own group), memberships and who owns each group, tenants | `nuxt4-layers/identity` |
| **Profile** | What does a person say about themselves, and who may see it? | Names, contact details and each person's choices about who sees them, encrypted with a key of their own | `nuxt4-layers/profile` |
| **Authorisation** | May this person do this, here, now? | Roles (owner, administrator, member, viewer and any the site adds) held in groups, and every yes-or-no decision | `nuxt4-layers/authorisation` |
| **iam-integration** | How do the four IAM layers fit together? | Nothing: small adapters that translate one layer's answer into another's question | `nuxt4-layers/iam-integration` |

The four IAM layers (identity and access management) are designed as a set. Identity is the hub: it issues the one identifier each person and group has, which the other three use.

## Three ideas that explain most of the code

### 1. Every change asks Authorisation

Whenever someone tries to change something (a page, a theme, a setting), the layer that owns it asks Authorisation: "may this person do this to this thing?". Authorisation looks at the roles the person holds in the group that owns the thing. The site's own content, themes and settings belong to the **platform group**, the group of the people who run the site. Today its only member is the **platform super admin**, an identity the seed creates, who cannot yet sign in. So every change is refused, and nothing is edited on the site.

### 2. Groups own things; people belong to groups

A person never owns site content directly. Content belongs to a group, and a person may act on it only while they belong to that group with a suitable role. When someone leaves a group, what it gave them ends. Every person also has a **personal group** of one, for things they keep to themselves.

### 3. Layers never call each other

Each layer declares the questions it needs answered (its **ports**) and the site supplies the answers when it starts. For example, Authorisation needs to know which groups a person belongs to; it does not ask Identity itself. The site passes Identity's answer to it through an adapter. This is why the site has "wiring" files that look complicated but contain no product decisions.

## What happens when…

| Someone… | What happens |
|---|---|
| Reads a page | The site asks Publisher for the published page at that address and draws it. Drafts, scheduled and archived pages answer exactly as if nothing were there |
| Creates an account | Authentication records the address and password and asks Identity for a new identifier; Identity creates the person in a waiting state. An email with a link goes out |
| Follows the email link | Authentication marks the address confirmed and tells Identity, which makes the person active and gives them a personal group. Profile is told, and starts an empty record for them |
| Signs in | Authentication checks the password, then a second step (an authenticator app's code or a passkey); every member has one. Then the side menu appears |
| Changes their profile | Profile checks it is really them, encrypts the details and stores them with who may see each one |
| Reads the members' notices | The site checks they are signed in, then asks Publisher for the notices and draws them. Signed-out visitors get nothing |
| Tries to change anything else | The owning layer asks Authorisation, which finds no role allowing it, and refuses |

## Where things are kept

All data is in one PostgreSQL database, divided into sections (schemas), one per layer: `publisher`, `configuration`, `authentication`, `identity`, `profile` and `authorisation`, plus the site's own few tables (themes, the `platform` note and the migrations log). No layer reads another's section.

The site connects to the database in two ways:

| Connection | Setting | Used by | Why |
|---|---|---|---|
| The owner | `DATABASE_URL` | The site's own tables, Publisher, Configuration, Theme Manager, Authentication, Authorisation, and every layer's table changes | It creates and changes tables |
| The runtime role | `DATABASE_RUNTIME_URL` | Identity and Profile while serving visitors | Identity and Profile insist on a connection that owns nothing and cannot get round their row-by-row protections |

## The wiring, file by file

These are the files most likely to look puzzling. None holds a product decision.

| File | Does |
|---|---|
| `nuxt.config.ts` | Lists the layers the site is built from, each pinned to one released version, and switches off the layers' own pages |
| `server/plugins/iam.ts` | At start-up, gives the four IAM layers their database connections and their answers to each other's questions, through iam-integration's adapters |
| `server/utils/iam.ts` | Gets Identity ready (its tables and the platform's identifiers), and passes events between the IAM layers |
| `server/plugins/publisher.ts`, `server/plugins/configuration.ts`, `server/plugins/theme-manager.ts` | The same for Publisher, Configuration and Theme Manager, including their questions to Authorisation |
| `server/utils/publisher-access.ts`, `server/utils/theme-policy.ts` | Translate "may this person change this?" from Publisher's and Theme Manager's terms into Authorisation's |
| `server/utils/permissions.ts` | The list of every permission Authorisation knows about. A permission not on the list is never granted |
| `server/database/seed-platform.ts`, `scripts/seed.ts` | `pnpm db:seed`: creates the platform in Identity (its tenant, super admin and platform group), then loads themes and the information pages |
| `server/database/runtime-role.ts` | Creates the runtime database connection's role |
| `server/tasks/iam/` | Background work every minute and every ten minutes: passing events between layers, and each layer's tidying up |
| `server/utils/mail.ts` | Sends the site's email (confirmation links, password resets) |

Everything a visitor reads is in `app/` (pages and components) and `data/` (words and settings).

## Words used in this repository

| Word | Means |
|---|---|
| Layer, capability | A building block from `nuxt4-layers`, released and pinned to one version |
| Host | The site itself, as the thing the layers are built into |
| Port | A question a layer needs the host to answer for it |
| Adapter | A small piece that turns one layer's answer into another layer's question |
| Tenant | A whole community the platform serves, kept apart from any other. Westray has one |
| Platform group | The group of people who run the site; it owns the site's own content and settings |
| Super admin | The platform group's first owner, created by the seed |
| Role | A named set of permissions held in a group: owner, administrator, member, viewer |
| Second step | The code or passkey asked for after the password (also called MFA) |
| Canary | Hidden test content with a unique marker; the tests prove no visitor ever sees it |

## Not built yet, by choice

- **Editing on the site.** It belongs to a separate layer, `content-editor`, still to be designed and built, which plugs into Publisher. Until then content changes are made in the repository and seeded.
- **Giving anyone a role**, including a way for the super admin to sign in.
- **Changing the site's facts on the site**, which also waits for editing.
- **Group administration** (clubs, committees, businesses), which waits for the design note on groups.

These, and the questions behind them, are for the design discussion: see the [plan](plan.md#next).
