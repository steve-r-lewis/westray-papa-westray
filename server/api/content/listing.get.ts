import { z } from 'zod'
import type { ContentListing } from '#shared/content'

const query = z.strictObject({
  section: z.string().max(200),
  limit: z.coerce.number().int().min(1).max(50).default(50),
})

// GET /api/content/listing?section=/news&limit=3 — the published documents a section
// of data/shell.json lists, as cards.
export default defineEventHandler(async (event): Promise<ContentListing> => {
  const parsed = query.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Bad request' })
  const section = (await readShell()).sections.find(entry => entry.path === parsed.data.section)
  if (!section) throw contentNotFound()
  try {
    const cards = await listSection(section, parsed.data.limit)
    setResponseHeader(event, 'cache-control', 'public, max-age=60')
    return { cards }
  }
  catch (error) {
    throw contentError(error)
  }
})
