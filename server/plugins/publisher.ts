import { SITE_ID } from '#shared/content'

// Connects Publisher: the document types in server/utils/document-types.ts, storage on
// the application's PostgreSQL pool (Publisher's own `publisher` schema, migrated at
// start-up), one site, and nobody signed in. Every change is refused until slice 1c
// (server/utils/publisher-access.ts). Publisher's own HTTP API is switched off in
// nuxt.config.ts; the site's screens read through server/api/content/ instead.
export default defineNitroPlugin(async () => {
  providePublisherDocumentTypes(WESTRAY_DOCUMENT_TYPES)
  providePublisherSiteResolver({ resolve: async () => SITE_ID })
  providePublisherSubjectResolver({ resolve: async () => null })
  providePublisherAccessDecision(publisherAccessPolicy)
  providePublisherEventSink(publisherEventsUnconsumed)
  // Feed titles follow Configuration's seo.title-template.
  providePublisherTitleTemplate({
    format: async ({ title }) => {
      const answer = await getConfiguration({ keys: ['seo.title-template'], visibility: 'public' })
      const template = answer?.values['seo.title-template']
      return typeof template === 'string' ? template.replace('%s', title) : title
    },
  })

  const pool = useDatabasePool()
  if (!pool) return
  providePublisherDatabase({ dialect: 'postgres', pool })
  try {
    await migratePublisherDatabase()
    await checkPublisherComposition()
  }
  catch (error) {
    // Content then answers 503 until the database is reachable.
    console.error('Publisher could not start on its database.', error)
  }
})
