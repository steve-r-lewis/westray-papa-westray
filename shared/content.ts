import type { PublisherRendered } from '@nuxt4-layers/publisher/contracts'

// What the site's screens know of Publisher's content: the site, the types anyone
// may read, and the cards a listing answers. The types themselves are registered
// with Publisher in server/utils/document-types.ts.

// One site: the islands. Publisher scopes every document to a site; a host with
// one answers a constant.
export const SITE_ID = 'westray'

// Types anyone may read, each at its own address.
export const PUBLIC_TYPES = ['page', 'article', 'blog-post', 'event', 'workshop', 'creative-trail-stop'] as const
export type PublicType = (typeof PUBLIC_TYPES)[number]

// Types listed in sections and fed as RSS and Atom. Pages are reached by address only.
export const LISTED_TYPES = ['article', 'blog-post', 'event', 'workshop', 'creative-trail-stop'] as const satisfies readonly PublicType[]
export type ListedType = (typeof LISTED_TYPES)[number]

// How a section orders what it lists: newest first, what is still to come by its
// start, or the Creative Trail by stop number.
export const LISTING_ORDERS = ['latest', 'upcoming', 'trail'] as const
export type ListingOrder = (typeof LISTING_ORDERS)[number]

// One document in a listing: only what a card draws, never the whole document.
export interface ContentCard {
  id: string
  type: ListedType
  title: string
  summary: string | null
  path: string
  publishedAt: string | null
  // Events and workshops.
  startsAt?: string
  endsAt?: string
  venue?: string
  // Creative Trail stops.
  stop?: number
  location?: string
}

// A published document as a page draws it: no versions, statuses or authors.
export interface ContentPage {
  id: string
  type: string
  title: string
  summary: string | null
  path: string | null
  locale: string
  publishedAt: string | null
  modifiedAt: string
  // The type's plain fields; formatted ones arrive as safe trees in `richText`.
  fields: Record<string, unknown>
  richText: PublisherRendered['richText']
  links: PublisherRendered['links']
}

export interface ContentListing {
  cards: ContentCard[]
}

// Dates and times are the islands', whatever the reader's device says.
export const SITE_TIME_ZONE = 'Europe/London'
