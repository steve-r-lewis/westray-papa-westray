import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import {
  addressDateSchema,
  PUBLISHER_BUNDLE_FORMAT,
  type PublisherBundle,
  type PublisherBundleDocument,
  type PublisherContentInput,
  UUID_V7_PATTERN,
} from '@nuxt4-layers/publisher/contracts'
import { z } from 'zod'
import { SITE_TIME_ZONE } from '../../shared/content.ts'

// Content as files, for seeding Publisher: one `<name>.json` per document, with its
// body in `<name>.md` beside it. Dates may be written relative to the day the seed
// runs, so demonstration content always looks current:
//
//   "published": { "days": -3 }                     three days ago, at 09:00
//   "startsAt": { "days": 9, "time": "19:30" }      in nine days, at 19:30
//
// Times are the islands' (Europe/London). A date may also be absolute: "2026-10-24"
// or an ISO 8601 instant.

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'not-a-time')

export const whenSchema = z.union([
  addressDateSchema,
  z.iso.datetime({ offset: true }),
  z.strictObject({ days: z.number().int().min(-3650).max(3650), time: time.optional() }),
])
export type When = z.infer<typeof whenSchema>

// A newer, unpublished version of a published document: what an editor has saved
// but not yet published.
const newerDraftSchema = z.strictObject({
  title: z.string().optional(),
  summary: z.string().nullable().optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
})

export const contentFileSchema = z.strictObject({
  id: z.string().regex(UUID_V7_PATTERN, 'not-a-uuidv7'),
  type: z.string(),
  title: z.string(),
  summary: z.string().nullable().default(null),
  slug: z.string().nullable().default(null),
  locale: z.string().default('en-GB'),
  // When it was first published; for a draft, when it was written.
  published: whenSchema,
  status: z.enum(['published', 'draft', 'scheduled', 'archived']).default('published'),
  // For `scheduled`: when it is due.
  publishAt: whenSchema.optional(),
  // The type's own fields, except `body`, which is the Markdown file. A field whose
  // value is a date may be written as a When.
  fields: z.record(z.string(), z.unknown()).default({}),
  dateFields: z.array(z.string()).default([]),
  newerDraft: newerDraftSchema.optional(),
}).refine(file => (file.status === 'scheduled') === (file.publishAt !== undefined), {
  message: 'publishAt is required for scheduled documents, and only for them',
  path: ['publishAt'],
})
export type ContentFile = z.infer<typeof contentFileSchema>

// Fields named in `dateFields` hold a When, turned into an instant.
const DEFAULT_TIME = '09:00'

/** The UTC offset of the islands' clock at an instant, in minutes. */
function siteOffsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone: SITE_TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(at).find(part => part.type === 'timeZoneName')?.value ?? 'GMT'
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name)
  return match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0
}

/** The islands' calendar date at an instant, as YYYY-MM-DD. */
export function siteDate(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SITE_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

/** The instant a local date and time on the islands names. */
export function siteInstant(date: string, at: string): Date {
  const guess = new Date(`${date}T${at}:00Z`)
  const first = new Date(guess.getTime() - siteOffsetMinutes(guess) * 60_000)
  // Corrects a guess that fell on the other side of a clock change.
  return new Date(guess.getTime() - siteOffsetMinutes(first) * 60_000)
}

function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`)
  day.setUTCDate(day.getUTCDate() + days)
  return day.toISOString().slice(0, 10)
}

export function resolveWhen(when: When, today: Date): Date {
  if (typeof when === 'string') return when.length === 10 ? siteInstant(when, DEFAULT_TIME) : new Date(when)
  return siteInstant(addDays(siteDate(today), when.days), when.time ?? DEFAULT_TIME)
}

async function filesIn(directory: string): Promise<string[]> {
  const found: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...await filesIn(path))
    else if (entry.name.endsWith('.json')) found.push(path)
  }
  return found.sort()
}

export interface ContentSource {
  file: string
  content: ContentFile
  body: string | null
}

/** Reads every document in a directory and its sub-directories. */
export async function readContentFiles(directory: string): Promise<ContentSource[]> {
  if (!existsSync(directory)) return []
  const sources: ContentSource[] = []
  for (const file of await filesIn(directory)) {
    const name = relative(directory, file)
    const parsed = contentFileSchema.safeParse(JSON.parse(await readFile(file, 'utf8')))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      throw new Error(`${name}: ${issue?.path.join('.') || 'file'}: ${issue?.message}`)
    }
    const markdown = file.replace(/\.json$/, '.md')
    sources.push({ file: name, content: parsed.data, body: existsSync(markdown) ? await readFile(markdown, 'utf8') : null })
  }
  return sources
}

function contentOf(source: ContentSource, today: Date, override: z.infer<typeof newerDraftSchema> = {}): PublisherContentInput {
  const { content } = source
  const fields: Record<string, unknown> = { ...content.fields, ...override.fields }
  for (const name of content.dateFields) {
    if (fields[name] === undefined) continue
    const when = whenSchema.safeParse(fields[name])
    if (!when.success) throw new Error(`${source.file}: fields.${name}: ${when.error.issues[0]?.message}`)
    fields[name] = resolveWhen(when.data, today).toISOString()
  }
  if (source.body !== null && fields.body === undefined) fields.body = source.body
  return {
    locale: content.locale,
    title: override.title ?? content.title,
    summary: override.summary !== undefined ? override.summary : content.summary,
    slug: content.slug,
    fields,
  }
}

/** One document as Publisher's bundle holds it: its versions, status and times. */
export function bundleDocument(source: ContentSource, today: Date): PublisherBundleDocument {
  const { content } = source
  const written = resolveWhen(content.published, today).toISOString()
  const versions: PublisherBundleDocument['versions'] = [
    { version: 1, savedAt: written, savedBy: null, restoredFrom: null, content: contentOf(source, today) as PublisherBundleDocument['versions'][number]['content'] },
  ]
  if (content.newerDraft) {
    versions.push({ version: 2, savedAt: written, savedBy: null, restoredFrom: null, content: contentOf(source, today, content.newerDraft) as PublisherBundleDocument['versions'][number]['content'] })
  }
  const published = content.status === 'published'
  return {
    id: content.id,
    type: content.type,
    status: content.status,
    publishedVersion: published ? 1 : null,
    reviewVersion: null,
    moderation: null,
    publishAt: content.publishAt ? resolveWhen(content.publishAt, today).toISOString() : null,
    unpublishAt: null,
    createdAt: written,
    updatedAt: written,
    publishedAt: published ? written : null,
    versions,
    redirects: [],
  }
}

export function contentBundle(sources: readonly ContentSource[], today: Date): PublisherBundle {
  const documents = sources.map(source => bundleDocument(source, today))
  return {
    format: PUBLISHER_BUNDLE_FORMAT,
    version: 1,
    exportedAt: today.toISOString(),
    types: [...new Set(documents.map(document => document.type))].sort(),
    documents,
  }
}
