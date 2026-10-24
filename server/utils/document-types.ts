import { richTextSchema } from '@nuxt4-layers/rich-text'
import { definePublisherDocumentType, instantSchema, safeTextSchema } from '@nuxt4-layers/publisher/contracts'
import { z } from 'zod'

// The document types Westray-Papa-Westray registers with Publisher, which names none
// of its own. Every formatted field is checked against its rich-text profile on save.
// Approval stays off until Authorisation and the approvals process arrive in slice 1c;
// until then no change is allowed at all (server/utils/publisher-access.ts).

const body = (max: number) => richTextSchema({ profile: 'document', max })

const dated = {
  startsAt: instantSchema,
  endsAt: instantSchema.optional(),
  venue: safeTextSchema({ max: 120 }),
  // Who runs it, as text: groups and their pages arrive in slice 2.
  organiser: safeTextSchema({ max: 120 }).optional(),
}

// Information pages at the site's root: /about, /policies/privacy-policy.
export const pageType = definePublisherDocumentType({
  type: 'page',
  label: { one: 'Page', many: 'Pages' },
  fields: z.strictObject({ body: body(100_000) }),
  address: { kind: 'path', base: '', pattern: 'slug' },
  lifecycle: { scheduling: true },
})

export const articleType = definePublisherDocumentType({
  type: 'article',
  label: { one: 'Article', many: 'Articles' },
  fields: z.strictObject({ body: body(50_000) }),
  address: { kind: 'path', base: '/articles', pattern: 'date-slug' },
  listing: { listable: true, order: 'published-desc' },
  lifecycle: { scheduling: true },
})

export const blogPostType = definePublisherDocumentType({
  type: 'blog-post',
  label: { one: 'Blog post', many: 'Blog posts' },
  fields: z.strictObject({ body: body(50_000) }),
  address: { kind: 'path', base: '/blog', pattern: 'date-slug' },
  listing: { listable: true, order: 'published-desc' },
  lifecycle: { scheduling: true },
})

export const eventType = definePublisherDocumentType({
  type: 'event',
  label: { one: 'Event', many: 'Events' },
  fields: z.strictObject({ ...dated, body: body(20_000) }),
  address: { kind: 'path', base: '/events', pattern: 'slug' },
  listing: { listable: true, order: 'published-desc' },
  lifecycle: { scheduling: true },
})

// Booking arrives with slice 7; until then a workshop is listed like an event.
export const workshopType = definePublisherDocumentType({
  type: 'workshop',
  label: { one: 'Workshop', many: 'Workshops' },
  fields: z.strictObject({ ...dated, body: body(20_000) }),
  address: { kind: 'path', base: '/workshops', pattern: 'slug' },
  listing: { listable: true, order: 'published-desc' },
  lifecycle: { scheduling: true },
})

export const creativeTrailStopType = definePublisherDocumentType({
  type: 'creative-trail-stop',
  label: { one: 'Creative Trail stop', many: 'Creative Trail stops' },
  fields: z.strictObject({
    stop: z.number().int().min(1).max(99),
    location: safeTextSchema({ max: 160 }),
    maker: safeTextSchema({ max: 120 }).optional(),
    body: body(20_000),
  }),
  address: { kind: 'path', base: '/creative-trail', pattern: 'slug' },
  listing: { listable: true, order: 'title-asc' },
})

// For signed-in members only: no address, never fed, and served by nothing until
// the members' area arrives with slice 1c.
export const membersNoticeType = definePublisherDocumentType({
  type: 'members-notice',
  label: { one: 'Members\' notice', many: 'Members\' notices' },
  fields: z.strictObject({ body: richTextSchema({ profile: 'block', max: 10_000 }) }),
  address: { kind: 'none' },
  listing: { listable: true, order: 'published-desc' },
  lifecycle: { scheduling: true },
})

export const WESTRAY_DOCUMENT_TYPES = [
  pageType,
  articleType,
  blogPostType,
  eventType,
  workshopType,
  creativeTrailStopType,
  membersNoticeType,
]
