import { fileURLToPath } from 'node:url'
import { buildPublisherRegistry, publisherBundleSchema, publisherContentSchema, publisherPermissions } from '@nuxt4-layers/publisher/contracts'
import { describe, expect, it } from 'vitest'
import { LISTED_TYPES, PUBLIC_TYPES } from '../../shared/content'
import { bundleDocument, contentBundle, readContentFiles, resolveWhen, siteInstant, type ContentSource } from '../../server/database/content-files'
import { WESTRAY_DOCUMENT_TYPES } from '../../server/utils/document-types'

const root = fileURLToPath(new URL('../..', import.meta.url))
const registry = buildPublisherRegistry(WESTRAY_DOCUMENT_TYPES)
const today = new Date('2026-10-24T10:00:00Z')

// Every version is checked as Publisher checks a save.
function expectValid(sources: ContentSource[]) {
  const bundle = publisherBundleSchema.parse(contentBundle(sources, today))
  for (const document of bundle.documents) {
    const declaration = registry.get(document.type)
    expect(declaration, document.type).toBeDefined()
    for (const version of document.versions) {
      const content = publisherContentSchema.parse(version.content)
      const fields = declaration!.fields.safeParse(content.fields)
      expect(fields.success, `${document.type} ${content.title}: ${fields.error?.issues[0]?.message}`).toBe(true)
    }
  }
  expect(new Set(bundle.documents.map(document => document.id)).size).toBe(bundle.documents.length)
}

describe('document types', () => {
  it('register with Publisher, public ones and the members\' notice', () => {
    expect([...registry.keys()].sort()).toEqual([...PUBLIC_TYPES, 'members-notice'].sort())
  })

  it('list and feed the listed types, and give members\' notices no address', () => {
    for (const type of LISTED_TYPES) expect(registry.get(type)!.listing.listable, type).toBe(true)
    expect(registry.get('page')!.listing.listable).toBe(false)
    expect(registry.get('members-notice')!.address.kind).toBe('none')
  })

  it('derive the permissions Authorisation will grant in slice 1c', () => {
    expect(publisherPermissions(registry).map(entry => entry.permission)).toContain('publisher.article.publish')
  })
})

describe('content files', () => {
  it('hold valid content for the real site and the demonstration, with no id shared between them', async () => {
    const real = await readContentFiles(`${root}data/content`)
    const demo = await readContentFiles(`${root}data/demo`)
    expect(real.length).toBeGreaterThan(0)
    expect(demo.length).toBeGreaterThan(0)
    expectValid([...real, ...demo])
  })

  it('keep the real site to its information pages, so it starts empty at launch', async () => {
    const real = await readContentFiles(`${root}data/content`)
    expect(new Set(real.map(source => source.content.type))).toEqual(new Set(['page']))
  })

  it('give the demonstration only invented telephone numbers and addresses', async () => {
    const demo = await readContentFiles(`${root}data/demo`)
    const text = demo.map(source => JSON.stringify(source.content) + source.body).join('\n')
    for (const phone of text.match(/\b0\d{3,4} ?\d{3} ?\d{3,4}\b/g) ?? []) expect(phone.replace(/ /g, ''), phone).toMatch(/^01632960\d{3}$/)
    for (const email of text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []) expect(email, email).toMatch(/@example\.org$/)
  })

  it('hold valid canary fixtures', async () => {
    expectValid(await readContentFiles(`${root}tests/fixtures/canaries`))
  })
})

describe('dates relative to today', () => {
  it('follow the islands\' clock, through the change from summer time', () => {
    expect(siteInstant('2026-07-01', '19:30').toISOString()).toBe('2026-07-01T18:30:00.000Z')
    expect(siteInstant('2026-12-01', '19:30').toISOString()).toBe('2026-12-01T19:30:00.000Z')
    // 24 October is summer time; four days on it is not.
    expect(resolveWhen({ days: 4, time: '20:00' }, today).toISOString()).toBe('2026-10-28T20:00:00.000Z')
    expect(resolveWhen({ days: -3 }, today).toISOString()).toBe('2026-10-21T08:00:00.000Z')
    expect(resolveWhen('2026-10-24', today).toISOString()).toBe('2026-10-24T08:00:00.000Z')
  })
})

describe('bundled documents', () => {
  const source = (content: Partial<ContentSource['content']>): ContentSource => ({
    file: 'test.json',
    body: 'Body.',
    content: {
      id: '01a17d16-ab09-783a-9939-c5eb24d214d9', type: 'article', title: 'T', summary: null, slug: 't', locale: 'en-GB',
      published: { days: -1 }, status: 'published', fields: {}, dateFields: [], ...content,
    },
  })

  it('publish version 1 when published', () => {
    const document = bundleDocument(source({}), today)
    expect(document).toMatchObject({ status: 'published', publishedVersion: 1, publishAt: null })
    expect(document.versions[0]!.content.fields).toEqual({ body: 'Body.' })
  })

  it('keep drafts and scheduled documents unpublished', () => {
    expect(bundleDocument(source({ status: 'draft' }), today)).toMatchObject({ status: 'draft', publishedVersion: null, publishedAt: null })
    expect(bundleDocument(source({ status: 'scheduled', publishAt: { days: 5 } }), today)).toMatchObject({ status: 'scheduled', publishedVersion: null })
  })

  it('add a newer draft as version 2, leaving version 1 published', () => {
    const document = bundleDocument(source({ newerDraft: { title: 'Draft' } }), today)
    expect(document.publishedVersion).toBe(1)
    expect(document.versions.map(version => version.content.title)).toEqual(['T', 'Draft'])
  })
})
