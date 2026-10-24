# Westray-Papa-Westray: Plan

> **In short:** the working plan. Every new chat reads this first. It says how we work, what is done, what is in progress and what comes next. It is kept short and current, never a history: the [README](../README.md) says what the site is and how to run it, and the [design](design.md) says why it is built as it is.

## How we work

Each block of work is done in its own new chat, started from a handover prompt. The chat updates this plan in its own PR (moving its block to Done and adjusting what follows), and its owner reports back in one line.

| Convention | Means |
|---|---|
| One draft PR per block | The plan's update rides in the same PR |
| British spelling | In code comments, documents and the site's text |
| No PR watching | Never subscribe to or watch PRs; if a subscription appears, unsubscribe |
| The local copy is a test environment | Development happens on GitHub. `scripts/provision.ps1` overwrites `.env` from `.env.example`, so settings belong in `.env.example`, never in `.env` |
| Layers pinned to release commits | Every `nuxt4-layers` capability is pinned to its release tag's commit, never a branch |

### Handover prompt

```text
In steve-r-lewis/westray-papa-westray, <outcome, in one or two sentences>.
Read docs/plan.md, README.md and docs/design.md first, then <other files>.
Checks: pnpm typecheck, pnpm test (with DATABASE_URL set), pnpm build,
python3 scripts/check_markdown.py, pnpm install --frozen-lockfile.
Update docs/plan.md in the same PR. One draft PR.
Report back with <the PR link only | the PR link and one line on …>.
```

## Done

Newest first.

- Slice 1c part 1, accounts: Authentication, Identity, Profile and Authorisation composed with iam-integration's adapters; sign-in, account, security and own profile pages; the platform super admin in Identity; access rules asking Authorisation: [steve-r-lewis/westray-papa-westray#17](https://github.com/steve-r-lewis/westray-papa-westray/pull/17)
- Theme Manager `v0.2.2` pinned here: [steve-r-lewis/westray-papa-westray#15](https://github.com/steve-r-lewis/westray-papa-westray/pull/15)
- Theme Manager `v0.2.2` released, installing from Git without a `prepare` script: [nuxt4-layers/theme-manager#72](https://github.com/nuxt4-layers/theme-manager/pull/72)
- `rich-text` pinned through a pnpm catalog: [steve-r-lewis/westray-papa-westray#14](https://github.com/steve-r-lewis/westray-papa-westray/pull/14)
- Slice 1b part 2, Publisher, contacts, demonstration mode and canary leak tests: [steve-r-lewis/westray-papa-westray#13](https://github.com/steve-r-lewis/westray-papa-westray/pull/13)
- Slice 1b part 1, Configuration for the site's facts: [steve-r-lewis/westray-papa-westray#12](https://github.com/steve-r-lewis/westray-papa-westray/pull/12)
- Slice 1a, shell, themes, migration runner, installation and provisioning: [#4](https://github.com/steve-r-lewis/westray-papa-westray/pull/4) to [#11](https://github.com/steve-r-lewis/westray-papa-westray/pull/11) in steve-r-lewis/westray-papa-westray

## In progress

Nothing: slice 1c part 1 is in review ([steve-r-lewis/westray-papa-westray#17](https://github.com/steve-r-lewis/westray-papa-westray/pull/17)).

## Next

In order:

1. Slice 1c part 2: editing and publishing on the site, and the members' area. Includes the platform super admin's own sign-in (Identity holds them, but no Authentication account yet), the roles that grant the site's own permissions (`server/utils/permissions.ts`), Configuration's administration pages, and serving members' notices to members.
2. A design note on contact and group responsibility, before slice 2: an enquiry capability and a contact form; creating, claiming and transferring groups; routing enquiries to a group without exposing anyone's personal address (see the design's [Contact](design.md#contact)).
3. Theme Manager 1.0's design, from the design's [proposals](design.md#themes), in its own repository.
4. The logo as a themed SVG, from the owner's Inkscape drawing.
5. Slice 2: Community (clubs, committees, organisations, businesses) and each group's administration.
6. Slice 3: the noticeboard, members' posts with moderation.
7. Slice 4: group themes and the person's choice, on Theme Manager 1.0.
8. Slice 5: social feed, polls and photo of the week, on new capabilities.
9. Slice 6: market and shops, on new product, order and payment capabilities.
10. Slice 7: workshop booking, on a new booking capability.

## Decisions to remember

Later work must not undo these without a decision of its own.

- Real layers only, pinned by tag; nothing is mocked, and what is not built says "coming soon".
- Everything a visitor reads is data, from capabilities or configuration, never from code.
- Publisher's own HTTP API is off: its listings, feeds and sitemap know nothing of audiences. The site reads only through `server/api/content/`.
- Members' notices are their own type, with no address and no feed; audience is never a field on a public type.
- A hidden document's address answers exactly as one that never held anything; the canary leak tests prove it.
- Rich text is drawn as safe trees, node by node, never as HTML.
- The real site starts empty apart from its information pages; demonstration content loads only with `DEMO_MODE=true`, on its own database.
- Demonstration settings (`demo.enabled`, `demo.launch-date`) are locked Configuration settings, set only by the deployment.
- There is no contact form until an enquiry capability exists; personal addresses are never exposed.
- Supabase is plain PostgreSQL only, never Supabase Auth or its data API; both it and Vercel stay in the UK.
- Seasonal themes are `public` and must pass Theme Manager's contrast checks (WCAG 2.2 AA) in light and dark.
- The site draws every screen: the IAM layers' own pages and components stay off (`presentation: false`), and every word on the account pages and in the site's email is in `data/shell.json`.
- Every member signs in with a second step (Authentication's default); a member's side menu appears only once it is done.
- Identity issues every identifier: `PLATFORM_SUPER_ADMIN_ID` names the provisioning request, and the `platform` table records what Identity issued. Never write to a layer's schema directly.
- Identity and Profile serve requests as a runtime role that owns nothing and cannot bypass row-level security (`DATABASE_RUNTIME_URL`).
- Signing in grants nothing: every change to content, themes and settings asks Authorisation, and the canary leak tests pass for a signed-in member with no roles as well as anonymously.

## Elsewhere

Each composed layer's roadmap, at the commit in use:

- Configuration `v1.2.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/configuration/blob/06703c5a45b370bf0f582bf012df1accc220db0b/docs/roadmap.md)
- Publisher `v1.0.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/publisher/blob/4410cab7b84c1b0395de2bdf657e3bcc3d476b87/docs/roadmap.md)
- Theme Manager `v0.2.2`: no `docs/roadmap.md` at that commit; see its [docs](https://github.com/nuxt4-layers/theme-manager/tree/ddade879d29da489df67796d156fa85ad4f80324/docs)
- Authentication `v1.0.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/authentication/blob/64a192a7f8f653480a533fc618594b1a02857537/docs/roadmap.md)
- Identity `v1.0.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/identity/blob/1ae51150c078e359bb946ed50ed58759b25d1744/docs/roadmap.md)
- Profile `v1.1.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/profile/blob/09babb2440b8f8f6cbb1e1fed4258bb3e72627fc/docs/roadmap.md)
- Authorisation `v1.0.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/authorisation/blob/888b4ebfb05cb08bd90d04b862ab780f786a7862/docs/roadmap.md)
- iam-integration `v1.1.0`: [docs/roadmap.md](https://github.com/nuxt4-layers/iam-integration/blob/a51bffe7e4730192047c9fa47b0fcb5d28ee7fcd/docs/roadmap.md), and its [operations guide](https://github.com/nuxt4-layers/iam-integration/blob/a51bffe7e4730192047c9fa47b0fcb5d28ee7fcd/docs/operations.md)
