import { z } from 'zod'
import { SITE_ID } from '#shared/content'

const query = z.strictObject({ path: z.string().min(1).max(1024) })

// GET /api/content/resolve?path=… — what an address holds now: a published document
// of a public type, or a redirect to its new address. A draft, a scheduled or
// archived document, a members' notice and a missing one all answer the same 404.
export default defineEventHandler(async (event) => {
  const parsed = query.safeParse(getQuery(event))
  if (!parsed.success) throw contentNotFound()
  let resolution
  try {
    resolution = await resolvePublisherPath({ siteId: SITE_ID, path: parsed.data.path, viewer: null, preview: false })
  }
  catch (error) {
    throw contentError(error)
  }
  setResponseHeader(event, 'cache-control', 'public, max-age=60')
  if (resolution.kind === 'redirect') return { kind: 'redirect' as const, to: resolution.to }
  if (resolution.kind === 'document' && isPublicType(resolution.rendered.document.type) && !resolution.rendered.preview) {
    return { kind: 'document' as const, page: contentPage(resolution.rendered) }
  }
  throw contentNotFound()
})
