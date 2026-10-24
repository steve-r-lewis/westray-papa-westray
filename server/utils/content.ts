import type { PublisherDocument, PublisherRendered } from '@nuxt4-layers/publisher/contracts'
import { PublisherFailure } from '@nuxt4-layers/publisher/contracts'
import { LISTED_TYPES, PUBLIC_TYPES, SITE_ID, type ContentCard, type ContentPage, type ListedType } from '#shared/content'
import type { Section } from '#shared/shell'

// Reading Publisher's content for anyone, signed in or not. Only published documents
// of public types are ever answered; anything else answers exactly as nothing at all.

export const isPublicType = (type: string): boolean => (PUBLIC_TYPES as readonly string[]).includes(type)
export const isListedType = (type: string): type is ListedType => (LISTED_TYPES as readonly string[]).includes(type)

/** One 404 for everything a reader may not see, whatever the reason. */
export function contentNotFound() {
  return createError({ statusCode: 404, statusMessage: 'Not found' })
}

/** Publisher's failures as the site answers them: not found, or unavailable. */
export function contentError(error: unknown) {
  if (error instanceof PublisherFailure && error.code === 'not-found') return contentNotFound()
  console.error('[content] Publisher failed:', error instanceof PublisherFailure ? `${error.code} ${error.reason ?? ''}` : error)
  return createError({ statusCode: 503, statusMessage: 'Content unavailable' })
}


/** What a page draws of a published document: no versions, statuses or authors. */
export function contentPage(rendered: PublisherRendered): ContentPage {
  const { document } = rendered
  const formatted = new Set(rendered.richText.map(field => field.path))
  return {
    id: document.id,
    type: document.type,
    title: document.title,
    summary: document.summary,
    path: document.path,
    locale: document.locale,
    publishedAt: document.publishedAt,
    modifiedAt: rendered.head.modifiedAt,
    fields: Object.fromEntries(Object.entries(document.fields).filter(([name]) => !formatted.has(name))),
    richText: rendered.richText,
    links: rendered.links,
  }
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function contentCard(document: PublisherDocument): ContentCard {
  const fields = document.fields
  const card: ContentCard = {
    id: document.id,
    type: document.type as ListedType,
    title: document.title,
    summary: document.summary,
    path: document.path ?? '/',
    publishedAt: document.publishedAt,
  }
  if (text(fields.startsAt)) card.startsAt = text(fields.startsAt)
  if (text(fields.endsAt)) card.endsAt = text(fields.endsAt)
  if (text(fields.venue)) card.venue = text(fields.venue)
  if (typeof fields.stop === 'number') card.stop = fields.stop
  if (text(fields.location)) card.location = text(fields.location)
  return card
}

const PAGE = 100

async function everyPublished(type: ListedType): Promise<PublisherDocument[]> {
  const documents: PublisherDocument[] = []
  for (let offset = 0; ; offset += PAGE) {
    const page = await listPublishedDocuments({ siteId: SITE_ID, type, limit: PAGE, offset })
    documents.push(...page.documents)
    if (documents.length >= page.total || page.documents.length === 0) return documents
  }
}

const time = (value: string | null | undefined) => (value ? Date.parse(value) : 0)

/** A section's cards, in its order, at most `limit`. Upcoming sections leave out what has finished. */
export async function listSection(section: Section, limit: number, now = new Date()): Promise<ContentCard[]> {
  const documents = (await Promise.all(section.types.map(everyPublished))).flat()
  // Only addressed, public documents are ever listed.
  let cards = documents.filter(document => isPublicType(document.type) && document.path).map(contentCard)
  if (section.order === 'latest') {
    cards.sort((a, b) => time(b.publishedAt) - time(a.publishedAt))
  }
  else if (section.order === 'upcoming') {
    cards = cards.filter(card => card.startsAt && time(card.endsAt ?? card.startsAt) >= now.getTime())
    cards.sort((a, b) => time(a.startsAt) - time(b.startsAt))
  }
  else {
    cards.sort((a, b) => (a.stop ?? 0) - (b.stop ?? 0) || a.title.localeCompare(b.title))
  }
  return cards.slice(0, limit)
}
