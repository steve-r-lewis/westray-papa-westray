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
| Accounts | Sign in, account, security, own profile | Authentication, Identity, Profile | 1 |
| Community | Clubs, Committees, Organisations, Businesses | Identity groups, Authorisation roles; Publisher for each public profile page | 2 |
| Administration | Dashboard: the group's pages, members, roles, documents, settings | As above, plus Configuration | 2 |
| Noticeboard | Posts by members, moderated | Publisher (submissions and moderation) | 3 |
| Themes | Group themes, the person's choice | Theme Manager 1.0, Configuration | 4 |
| Social | My feed, polls, photo of the week | New capabilities: feed, polls, images | 5 |
| Market | Market, Shop, Products, Shops | New capabilities: product, order, payment | 6 |
| Bookings | Workshop booking | New capability: booking | 7 |

Document types (article, blog post, event, workshop, trail stop, group page, notice) are registered by Westray-Papa-Westray with the publisher; no layer names them.

## Themes

The mock-up's seasonal palettes become Theme Manager themes; light, dark and system are the person's preference. Every theme must pass Theme Manager's contrast checks before it is published: the mock-up's light-green text on pale green does not.

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
| Background work | Vercel Cron runs each capability's outbox relay and maintenance, until a job service exists |
| Secrets and keys | Vercel environment variables; a managed key service for Profile's key wrapper in production |
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

1. Slice 1: the application shell and layout, Westray-Papa-Westray themes, information, news, what's on and accounts.
2. Theme Manager 1.0 design, from the table above, in its own repository.
