# Westray

> **AI-Driven Development**
>
> Part of [Nuxt 4 Layers](https://github.com/nuxt4-layers), an experimental, AI-driven software engineering initiative. AI performs the principal engineering work under human direction; the project owner decides requirements, acceptance and releases. See [AI Development](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/AI_DEVELOPMENT.md).

> **In short:** the community website for Westray and Papa Westray, in Orkney: island news, what's on, clubs and businesses, a noticeboard and, later, a social feed and a marketplace. It is also the reference application for the `nuxt4-layers` platform.

## Status

**Design agreed; no code yet.** Slice 1 is next. See the [design](docs/design.md).

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

Westray draws every screen itself and composes headless `nuxt4-layers` capabilities, pinned by tag ([ADR-0009](https://github.com/nuxt4-layers/platform-architecture/blob/b3ef6dd53faa097d7a6b509ec714ea7e447b3051/docs/decisions/ADR-0009-headless-capability-layers.md)).

| Capability | Gives Westray |
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

Set-up commands arrive with slice 1.

## Documents

- [Design](docs/design.md): site map, slices, themes, deployment, later stores and legal duties
- [Platform architecture](https://github.com/nuxt4-layers/platform-architecture/tree/b3ef6dd53faa097d7a6b509ec714ea7e447b3051): the rules every layer follows

## Licence

[MIT](LICENSE)
