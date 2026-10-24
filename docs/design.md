# Westray-Papa-Westray: Design

> **In short:** Westray-Papa-Westray is the community website of the two islands, Westray and Papa Westray, and the platform's reference application. It composes released `nuxt4-layers` capabilities, draws every screen itself, and grows in slices: community first, commerce later. Nothing is mocked; what is not built yet says so.

## Why

The platform's capabilities are headless ([ADR-0009](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/docs/decisions/ADR-0009-headless-capability-layers.md)). An application must draw their screens, and a real one shows what `ui` should offer better than guesswork. The earlier Westray mock-up (`westray.uk`) supplies the site map, layout and look.

## Principles

| Principle | Means |
|---|---|
| Real layers only | Capabilities are pinned by tag; no mocked APIs. A page whose capability is not built shows "coming soon" |
| Everything is data | Text, menus, themes, types and settings come from capabilities or configuration, never from code |
| Screens here first | Components move to `ui` once they know no capability; to a kit when a second application needs them |
| One audience per area | Public site, members' area and group administration are kept apart |

## Site map

| Area | Pages | Served by | Slice |
|---|---|---|---|
| Information | Home, About, Policies, Contact | Publisher (page types), Configuration (site facts, contact, links) | 1 |
| News | Articles, Blog | Publisher | 1 |
| What's on | Events, Workshops, Creative Trail (listings) | Publisher | 1 |
| Accounts | Sign in, account, security, own profile | Authentication, Identity, Profile, Authorisation | 1 |
| Community | Clubs, Committees, Organisations, Businesses | Identity groups, Authorisation roles; Publisher for each public profile page | 2 |
| Administration | Dashboard: the group's pages, members, roles, documents, settings | As above, plus Configuration | 2 |
| Noticeboard | Posts by members, moderated | Publisher (submissions and moderation) | 3 |
| Themes | Group themes, the person's choice | Theme Manager 1.0, Configuration | 4 |
| Social | My feed, polls, photo of the week | New capabilities: feed, polls, images | 5 |
| Market | Market, Shop, Products, Shops | New capabilities: product, order, payment | 6 |
| Bookings | Workshop booking | New capability: booking | 7 |

Document types (page, article, blog post, event, workshop, trail stop, members' notice; later group page and notice) are registered by Westray-Papa-Westray with the publisher; no layer names them.

## Site facts

Slice 1b composes Configuration `v1.2.0`. The site's name, tagline, locale, default theme, title template, description and social links are deployment values in `data/configuration.json`, read through Configuration's public endpoint. Changing a value at the platform scope goes through Identity and Authorisation (who may change it, and a second person for `high` settings): since slice 1c part 1 Configuration's administration asks both, through its own adapters, on the platform group, where nobody yet holds `configuration.platform-settings:manage`. Its administration pages stay off until editing on the site arrives in part 2; until then a change is a commit. Configuration keeps its tables in its own schema and migrates them at start-up. Unlike its documentation's account, it needs the database even to serve deployment values, so the site now requires one.

### Contact

The organisation (Westray Digital Access Group) and its `contact.general`, `contact.data-protection` and `contact.security` are deployment values too, each now the one mailbox. The Contact page lists them by role (general enquiries, data protection officer, security) under the words of Publisher's `/contact` page, and `/.well-known/security.txt` (RFC 9116) is written from `contact.security`, with an `Expires` six months ahead worked out on every request.

There is no contact form. A form needs somewhere to send what people write and a way to choose who attends to it, which belong to an enquiry capability, still to be designed. Before slice 2, a design note covers contact and group responsibility: that capability, creating, claiming and transferring groups, and routing enquiries to a group without exposing anyone's personal address.

## Content

Slice 1b composes Publisher `v1.0.0` for everything a visitor reads beyond the shell.

| Part | How |
|---|---|
| Types | Registered by the site (`server/utils/document-types.ts`): page (at the site's root), article and blog post (dated addresses, listed and fed), event and workshop (start, end, venue, organiser), Creative Trail stop (number, place, maker), and members' notice. Every formatted field is `rich-text`, checked on every save |
| Storage | Publisher's own `publisher` schema on the application's `pg` pool, migrated at start-up |
| Who | One site (`westray`), the signed-in person from Authentication, and access decisions from Authorisation: every document belongs to the platform group, so a permission (`publisher.<type>:<action>`) is held only through a role there. Its one member, the platform super admin, cannot sign in until part 2, so every change and every draft preview is still refused. Approval is off for every type until then; legal pages are candidates for it |
| Reading | Publisher's own HTTP API is switched off. The site serves only what anyone may read, through `server/api/content/` (an address's published document; a section's cards), feeds per listed type, and the sitemap. Whatever a reader may not see answers exactly as nothing at all |
| Drawing | The site's own components, with Theme Manager's classes only. Rich text arrives as safe trees and is drawn node by node, never as HTML; `doc:` links follow their document's current address, or are plain text while it is unpublished |
| Sections | Listed in `data/shell.json`: which types each lists and in which order (newest first, what is still to come, or by trail stop). The What's on and News dashboard panels show the first few of their section |
| Seeding | `pnpm db:seed` imports `data/content/` with `importPublisherContent`; `--update` saves a changed file as a new version. The real site starts with its information pages only |
| Members only | The members' notice has no address and no feed, so nothing serves it until the members' area in slice 1c part 2. A published document's audience cannot be narrowed by a field, because Publisher's listings, feeds and sitemap know nothing of audiences |

The leak tests seed drafts, scheduled and archived documents, a newer draft of a published article and a members' notice, each with a canary string, and prove that no anonymous answer ever shows one.

### Demonstration

A separate pre-launch deployment shows the site filled with invented content. Two settings the application declares with Configuration, `demo.enabled` and `demo.launch-date`, are `locked`, so the deployment's environment alone sets them. With them, every page carries a banner saying everything is fictitious, when the site launches and that it starts empty; nothing is indexed (`noindex` on every answer, a disallowing `robots.txt`); and the seed adds `data/demo/`, whose dates are relative to the day it runs. The demonstration's groups are invented but based on island life, with fictitious people, `01632 960xxx` numbers and `example.org` addresses; groups that exist on the islands keep only their names.

## Accounts

Slice 1c part 1 composes the IAM suite: Authentication `v1.0.0`, Identity `v1.0.0`, Profile `v1.1.0` and Authorisation `v1.0.0`, joined by iam-integration `v1.1.0`'s reference adapters, as the suite's operations guide asks. Members never import one another; the site supplies each one's ports.

| Part | How |
|---|---|
| Screens | The site's own pages and components (`app/pages/sign-in.vue`, `app/pages/account/`), styled with Theme Manager's classes, every word from `data/shell.json`. The layers' own pages and components are switched off (`presentation: false`); their composables and endpoints are used |
| Signing in | A password, then a second step: every member uses an authenticator app (with backup codes) or a passkey, as Authentication requires by default. A passkey alone also signs in. Addresses are confirmed by an emailed link; resets likewise |
| Identifiers | Identity issues every identifier (UUIDv7) and takes none from outside. The seed provisions the platform once, as its operator: the tenant everyone signs up into, the platform super admin (Identity's identity for the provisioning request `PLATFORM_SUPER_ADMIN_ID`) and the platform group they own. The site records what Identity issued in its `platform` table |
| Profile | The person's names and contact details, each with its audience (only them, their groups, every member), and how they are shown. Profile encrypts each person's record with their own key, wrapped by master keys from `PROFILE_KEYS` until a managed key service takes over |
| Access | Changes to content, themes and the site's settings ask Authorisation (`server/utils/permissions.ts`), on the platform group for the site's own things. Authorisation's built-in roles are extended only as the suite asks (Identity's and Profile's high and critical permissions). Only the platform group's owner, the super admin, holds the site's own content permissions, through the owner role; theme changes and platform settings are held by nobody |
| Storage | Each member its own schema. Authentication and Authorisation on the owner's pool; Identity and Profile on a runtime role that owns nothing and cannot bypass their row-level security (`DATABASE_RUNTIME_URL`), created by the seed and the site as the owner |
| Events and upkeep | Each member's outbox is relayed to the others through iam-integration's handlers (an empty Profile record on `identity.provisioned`, roles kept in step with owners and memberships), and each member's maintenance runs, as Nitro tasks every minute and every ten minutes: Vercel Cron in production. Access never waits for them |
| Email | Authentication's messages and Profile's codes, in the shell's words, sent by SMTP, or written to a directory on a developer's machine and in the tests |

Part 2 adds editing and publishing on the site (roles in the platform group, and the super admin's own sign-in) and the members' area, where members' notices are served.

## Themes

The mock-up's seasonal palettes become Theme Manager themes; light, dark and system are the person's preference. Every theme must pass Theme Manager's contrast checks before it is published: the mock-up's light-green text on pale green does not.

Done in slice 1a, on Theme Manager `v0.2.2`:

| Part | How |
|---|---|
| Palettes | Spring, Summer, Autumn and Winter, generated from Theme Manager's default palette: the page-layer and purpose roles take the season's hue, status roles keep theirs, and every Pen/Fill pair reaches 4.5:1 and every Edge/Fill pair and focus ring 3:1 in light and dark |
| Ownership | Seeded as the platform super admin's themes (`ownerType: user`), published and `public`. Theme Manager accepts `shared` but gives it no meaning, so `public` is what offers them to everyone |
| Storage | A `themes` table holding the canonical Theme JSON, behind Theme Manager's repository port |
| Access | Anyone may read and use public themes. Every change asks Authorisation for `themes:<action>` on the group owning the theme (a person's personal group, a group, or the platform group); these are `high`, so no role's wildcard reaches them and none names them yet: every change is refused. Theme Manager's management pages are not exposed |
| Choosing | A palette picker and a System, Light and Dark switch, behind one Appearance button in the header. A visitor gets a cookie only by choosing; until then the site's default theme (Spring) applies |
| Members | The side menu is for signed-in members, once their second step is done; the public sections are the header's links and the home page's dashboard panels |

Theme Manager 1.0 adds what groups need. These are proposals for its contract:

| Need | Proposal |
|---|---|
| Owner | A group (a person's own themes belong to their personal group), a tenant, or the system. `organisation` is dropped: organisations are groups |
| Tenant | Every theme carries its tenant |
| Visibility | Private to the owning group; offered to named groups; offered to the owning group's sub-groups (explicit, never inherited); public |
| Who manages | Theme Manager names the actions; Authorisation's roles grant them per group. Making a theme public is `high` risk and needs a second person |
| Which applies | The person's choice, if allowed; else the group's default; else the site's; else the system's. Defaults are Configuration settings naming a theme |

## Deployment

Developed locally; published on Vercel with Supabase.

| Part | Choice |
|---|---|
| Database | Supabase as plain PostgreSQL only: never Supabase Auth or its data API. Transaction pooler from Vercel functions, prepared statements off; tenant and scopes set per transaction (`SET LOCAL`) |
| Region | UK for both: Supabase London, Vercel `lhr1` |
| Files | Supabase Storage, behind a port |
| Background work | Vercel Cron runs each capability's outbox relay and maintenance (the IAM suite's as Nitro scheduled tasks), until a job service exists |
| Secrets and keys | Vercel environment variables (Authentication's secret, Profile's master keys, SMTP); a managed key service for Profile's key wrapper in production |
| Local | PostgreSQL 16 in a container; the same migrations |

### Stores added later, without a rebuild

Each new store is a port in the capability that needs it and an adapter here ([ADR-0006](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/docs/decisions/ADR-0006-polyglot-persistence-and-data-store-security.md)). Derived stores are built by replaying outbox events from PostgreSQL, which stays the system of record.

| Need | Candidate | Role |
|---|---|---|
| Social graph | Neo4j or Memgraph | Derived copy for traversal; follows stay in PostgreSQL |
| Search | OpenSearch; Meilisearch or Typesense for simplicity | Derived index, filtered by tenant and scopes inside the query |
| Cache | Valkey, or Upstash | Keyed by tenant and caller's scopes |
| Unstructured data | PostgreSQL JSONB first; FerretDB if needed | System of record within its capability |

## Legal duties

To be confirmed with legal advice before each slice goes live.

| Slice | Duty |
|---|---|
| All | UK GDPR and the Data Protection Act 2018; PECR for cookies and similar storage; WCAG 2.2 AA |
| 3 and 5: members' posts | Online Safety Act 2023: illegal-content risk assessment, children's access assessment, reporting and complaints, clear terms. Moderation designed before launch |
| 6: market | Consumer Rights Act 2015, Consumer Contracts Regulations 2013 and the Digital Markets, Competition and Consumers Act 2024 (including fake reviews and hidden fees). A payment provider holds card data and funds, so Westray-Papa-Westray handles neither |

## What follows

| Gains | Costs |
|---|---|
| A real product steers every contract and `ui` | Slices 5 to 7 wait for capabilities to be designed and built |
| Slices 1 to 3 need no new capability | Theme Manager 1.0 must land before group themes |
| New stores arrive as adapters, not rebuilds | Each derived store needs erasure and rebuild tests |

## Next

What comes next is in the [plan](plan.md#next).
