import { randomUUID } from 'node:crypto'
import type pg from 'pg'
import {
  buildPublisherRegistry,
  canonicalJson,
  PublisherFailure,
  publisherContentSchema,
  type PublisherBundleDocument,
  type PublisherSubject,
} from '@nuxt4-layers/publisher/contracts'
import { SITE_ID } from '../../shared/content.ts'
import { WESTRAY_DOCUMENT_TYPES } from '../utils/document-types.ts'
import { contentBundle, type ContentSource } from './content-files.ts'
// Publisher's server functions, outside Nitro: its package exports only the layer and
// its contract, so the seed reaches them by path. Both modules come from the one
// installed copy, so the ports supplied here are the ones the functions use.
import {
  providePublisherAccessDecision,
  providePublisherDatabase,
  providePublisherDocumentTypes,
} from '../../node_modules/@nuxt4-layers/publisher/server/utils/publisher-composition.ts'
import {
  exportPublisherContent,
  importPublisherContent,
  migratePublisherDatabase,
  transitionPublisherDocument,
} from '../../node_modules/@nuxt4-layers/publisher/server/utils/publisher-server.ts'

// Seeds Publisher from content files (server/database/content-files.ts) with
// importPublisherContent. A document already stored is left as it is unless `update`
// is set; then, when its file differs from its newest version, the file is saved as
// a new version (and published, if the document is published), keeping its history.

export interface ContentSeedResult {
  added: string[]
  updated: string[]
  unchanged: string[]
}

const registry = buildPublisherRegistry(WESTRAY_DOCUMENT_TYPES)

// The seed acts as a service of its own when it updates content. The site itself
// refuses every change until slice 1c; only this script, run by whoever deploys,
// may make one.
const SEED_SERVICE_ID = '01900000-0000-7000-8000-000000005eed'

function seedSubject(now: Date): PublisherSubject {
  return { identityId: SEED_SERVICE_ID, kind: 'service', assurance: { level: 'aal2', phishingResistant: true, authenticatedAt: now.toISOString() } }
}

/** The content as Publisher would store it, or an error naming the file and the problem. */
function normalised(document: PublisherBundleDocument, file: string) {
  const declaration = registry.get(document.type)
  if (!declaration) throw new Error(`${file}: '${document.type}' is not a registered document type`)
  return document.versions.map((version) => {
    const envelope = publisherContentSchema.safeParse(version.content)
    if (!envelope.success) throw new Error(`${file}: ${envelope.error.issues[0]?.path.join('.')}: ${envelope.error.issues[0]?.message}`)
    const fields = declaration.fields.safeParse(envelope.data.fields)
    if (!fields.success) throw new Error(`${file}: fields.${fields.error.issues[0]?.path.join('.')}: ${fields.error.issues[0]?.message}`)
    return { ...envelope.data, fields: fields.data as Record<string, unknown> }
  })
}

export async function seedContent(
  pool: pg.Pool,
  sources: readonly ContentSource[],
  options: { today: Date, update?: boolean },
): Promise<ContentSeedResult> {
  providePublisherDocumentTypes(WESTRAY_DOCUMENT_TYPES)
  providePublisherDatabase({ dialect: 'postgres', pool })
  providePublisherAccessDecision({ allows: async ({ identityId }) => identityId === SEED_SERVICE_ID })
  await migratePublisherDatabase()

  const bundle = contentBundle(sources, options.today)
  const sourceOf = new Map(bundle.documents.map((document, index) => [document.id, sources[index]!]))
  const files = new Map(bundle.documents.map((document, index) => [document.id, sources[index]!.file]))
  const contents = new Map(bundle.documents.map(document => [document.id, normalised(document, files.get(document.id)!)]))

  const stored = new Map((await exportPublisherContent({ siteId: SITE_ID })).documents.map(document => [document.id, document]))
  const result: ContentSeedResult = { added: [], updated: [], unchanged: [] }
  const correlationId = randomUUID()

  const missing = bundle.documents.filter(document => !stored.has(document.id))
  if (missing.length > 0) {
    try {
      await importPublisherContent({ siteId: SITE_ID, bundle: { ...bundle, documents: missing }, correlationId })
    }
    catch (error) {
      if (error instanceof PublisherFailure) throw new Error(`Publisher refused the content: ${error.code}${error.reason ? ` (${error.reason})` : ''}`)
      throw error
    }
    result.added.push(...missing.map(document => files.get(document.id)!))
  }

  for (const document of bundle.documents) {
    const existing = stored.get(document.id)
    if (!existing) continue
    const file = files.get(document.id)!
    const newest = existing.versions.reduce((a, b) => (b.version > a.version ? b : a))
    const wanted = contents.get(document.id)!.at(-1)!
    if (!options.update || canonicalJson(newest.content) === canonicalJson(wanted) || existing.status === 'archived') {
      result.unchanged.push(file)
      continue
    }
    const subject = seedSubject(options.today)
    const saved = await transitionPublisherDocument({
      siteId: SITE_ID, subject, correlationId,
      documentId: document.id,
      request: { action: 'save', expectedVersion: newest.version, content: wanted },
    })
    // A file holding a newer draft keeps it unpublished, as an editor would.
    if (existing.status === 'published' && !sourceOf.get(document.id)!.content.newerDraft) {
      await transitionPublisherDocument({
        siteId: SITE_ID, subject, correlationId,
        documentId: document.id,
        request: { action: 'publish', expectedVersion: saved.latestVersion },
      })
    }
    result.updated.push(file)
  }
  return result
}
