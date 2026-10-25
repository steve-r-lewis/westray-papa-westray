# Westray-Papa-Westray: Plan

> **In short:** the working plan. New to the code? Read [Architecture in plain English](architecture.md) first. Every new chat reads this first. It says how we work, what is done, what is in progress and what comes next. It is kept short and current, never a history: the [README](../README.md) says what the site is and how to run it, and the [design](design.md) says why it is built as it is.

## How we work

Each block of work is done in its own new chat, started from a handover prompt. The chat updates this plan in its own PR (moving its block to Done and adjusting what follows), and its owner reports back in one line.

| Convention | Means |
|---|---|
| One draft PR per block | The plan's update rides in the same PR |
| British spelling | In code comments, documents and the site's text |
| No PR watching | Never subscribe to or watch PRs; if a subscription appears, unsubscribe |
| The local copy is a test environment | Development happens on GitHub. `scripts/provision.ps1` overwrites `.env` from `.env.example`, so settings belong in `.env.example`, never in `.env` |
| Layers pinned to release commits | Every `nuxt4-layers` capability is pinned to its release tag's commit, never a branch |
| Lean checks in chat | A chat runs only the type check, unit tests and Markdown check, then pushes. CI and the owner's `./scripts/provision.ps1 -Check` run the database and end-to-end suites; the owner pastes back only the failures |
| Read before building | A handover names the existing code and layer docs to reuse (other repositories included), and a chat reads them before writing anything new |

### Handover prompt

```text
In steve-r-lewis/westray-papa-westray, <outcome, in one or two sentences>.
Read docs/plan.md, README.md and docs/design.md first, then <existing code and
layer docs to reuse, in this or other repositories>.
Checks in this chat: pnpm typecheck, pnpm test (without DATABASE_URL),
python3 scripts/check_markdown.py. CI and the owner run the rest.
Update docs/plan.md in the same PR. One draft PR.
Report back with <the PR link only | the PR link and one line on …>.
```

## Done

Newest first.

- Plan updated with the design notes below: this PR
- Gallery's design: albums and photo of the week as Publisher types over media's images; group editors moderate members' submissions; people publish their own albums: [nuxt4-layers/gallery#1](https://github.com/nuxt4-layers/gallery/pull/1)
- Media's design: web-ready, group-owned images, private originals, allowances by entitlement, reporting and takedown, members-only images served through the site: [nuxt4-layers/media#1](https://github.com/nuxt4-layers/media/pull/1), [#2](https://github.com/nuxt4-layers/media/pull/2) and [#3](https://github.com/nuxt4-layers/media/pull/3)
- content-editor's design: Publisher's functions passed by the host, a formatted editor saving safe trees, forms from each type, images from media: [nuxt4-layers/content-editor#1](https://github.com/nuxt4-layers/content-editor/pull/1)
- One-page host contracts (`CONTRACT.md`): the IAM suite [nuxt4-layers/iam-integration#25](https://github.com/nuxt4-layers/iam-integration/pull/25), Publisher [nuxt4-layers/publisher#11](https://github.com/nuxt4-layers/publisher/pull/11), Configuration [nuxt4-layers/configuration#11](https://github.com/nuxt4-layers/configuration/pull/11), Theme Manager [nuxt4-layers/theme-manager#74](https://github.com/nuxt4-layers/theme-manager/pull/74)
- ADR-0012 accepted, with `CONTRACT.md`'s limit raised to 200 lines: [nuxt4-layers/platform-architecture#26](https://github.com/nuxt4-layers/platform-architecture/pull/26)
- Architecture in plain English, describing what exists before the design discussion: this PR
- Slice 1c part 2, the members' area: members' notices for signed-in members, nothing for anyone signed out; the canary leak tests for a signed-in member with no roles. Editing moves to content-editor: this PR
- Slice 1c part 1, accounts: Authentication, Identity, Profile and Authorisation composed with iam-integration's adapters; sign-in, account, security and own profile pages; the platform super admin in Identity; access rules asking Authorisation: [steve-r-lewis/westray-papa-westray#17](https://github.com/steve-r-lewis/westray-papa-westray/pull/17)
- Theme Manager `v0.2.2` pinned here: [steve-r-lewis/westray-papa-westray#15](https://github.com/steve-r-lewis/westray-papa-westray/pull/15)
- Theme Manager `v0.2.2` released, installing from Git without a `prepare` script: [nuxt4-layers/theme-manager#72](https://github.com/nuxt4-layers/theme-manager/pull/72)
- `rich-text` pinned through a pnpm catalog: [steve-r-lewis/westray-papa-westray#14](https://github.com/steve-r-lewis/westray-papa-westray/pull/14)
- Slice 1b part 2, Publisher, contacts, demonstration mode and canary leak tests: [steve-r-lewis/westray-papa-westray#13](https://github.com/steve-r-lewis/westray-papa-westray/pull/13)
- Slice 1b part 1, Configuration for the site's facts: [steve-r-lewis/westray-papa-westray#12](https://github.com/steve-r-lewis/westray-papa-westray/pull/12)
- Slice 1a, shell, themes, migration runner, installation and provisioning: [#4](https://github.com/steve-r-lewis/westray-papa-westray/pull/4) to [#11](https://github.com/steve-r-lewis/westray-papa-westray/pull/11) in steve-r-lewis/westray-papa-westray

## In progress

Nothing.

## Next

In order:

1. Media: the owner confirms a Vercel Blob store can be held in London; then build and release media to its [design](https://github.com/nuxt4-layers/media/blob/4d76598b1ef6e86419f0520f927cf85f3a51bfb1/docs/design.md): the core (direct uploads, processing, allowances, private serving, reporting), its screens (picker, library, reports), `examples/minimal-host` and `CONTRACT.md`.
2. content-editor: its design gains moderation screens for Publisher's queue (the gallery needs them); then build and release it on media, and compose both through Publisher's editor slot. Editing and publishing on the site, previews, images and the roles that grant them come with it.
3. Adopt ADR-0012, one layer per chat: Theme Manager, Publisher, iam-integration with the IAM suite, Configuration; after each, a small Westray-Papa-Westray chat deletes the wiring it replaces.
4. Westray-Papa-Westray uses the IAM layers' own screens (sign-in, account, security, profile, groups, access) and deletes its own account pages.
5. People who run the site: the super admin's passkey sign-in from an operator script's one-time link; invitations to the platform group, accepted, then a role; the site's facts' administration.
6. A design note on contact and groups, before slice 2: self-service groups, claiming and transferring, an enquiry capability and contact form, routing enquiries without exposing personal addresses (see the design's [Contact](design.md#contact)).
7. Slice 2: Community (clubs, committees, organisations, businesses) and each group's administration.
8. Logging and reporting: an audit capability collecting every layer's events, with reports over it.
9. Theme Manager 1.0's design, from the design's [proposals](design.md#themes), in its own repository.
10. The logo as a themed SVG, from the owner's Inkscape drawing.
11. Slice 3: the noticeboard, members' posts with moderation.
12. Slice 4: group themes and the person's choice, on Theme Manager 1.0.
13. Slice 5: the gallery, to its [design](https://github.com/nuxt4-layers/gallery/blob/8751fc168b7a7104442f52e9a25e6e796dbddf2e/docs/design.md) (public and members' albums, members' submissions moderated by group editors, people's own albums, photo of the week); social feed and polls on new capabilities.
14. Slice 6: market and shops, on new product, order and payment capabilities, with subscriptions and entitlements (discount codes, such as always free for islanders, granted by code or invitation).
15. Slice 7: workshop booking, on a new booking capability.

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
- Editing belongs to `nuxt4-layers/content-editor`, composed through Publisher's editor slot; the site builds no editor of its own.
- Members' notices are served only to signed-in members, by the site's own endpoint; they never get an address or a feed.
- Standard screens come from the layers' own optional presentation parts (amended ADR-0009); Westray-Papa-Westray draws only its own screens. Composition follows ADR-0012: one call per layer, defaults for every other port, and a one-page `CONTRACT.md` pasted into handovers.
- A second step is non-negotiable for everyone. Passkeys are the preferred sign-in, including from a phone for a computer; an authenticator app's code is the fallback; no push-approval prompts. The super admin and site administrators sign in with a passkey.
- Roles on the site, the super admin's included, come by invitation, acceptance, then the role. Two owners are recommended for every group and the platform, not required; Identity's recovery and break-glass cover a lone owner.
- Groups are self-service: members create them under a platform-owned Community group and own them at once, with logging and reporting after the fact rather than approval before.
- Payments, subscriptions and exceptions such as always free for islanders are entitlements, granted by discount code or invitation, from capabilities still to be built.
- Images come from `nuxt4-layers/media`: owned by a group, made web-ready on upload, stripped of location and every other metadata, with alt text required and the uploader always recorded. Originals are kept only where a group's entitlement allows, and never public. Members-only images are served through the site with an access check.
- Uploaders confirm a parent's or guardian's consent for anyone identifiable under 18, and credit any image they did not take. Every public image can be reported and taken down from media's first release.
- Each group has 100 MB of free storage (25 MB uploads where originals are kept); more comes by entitlement. Over the allowance, uploads are refused and nothing is deleted. Files stay in the UK: the Vercel Blob store's region is confirmed before use.
- The gallery owns no data: albums are Publisher types over media's images. Group editors moderate members' submissions; people with their own accounts publish their own albums and are responsible for them.
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
