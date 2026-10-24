import { SITE_ID } from '#shared/content'

// GET /feeds/{type}/rss and /feeds/{type}/atom — the newest published documents of a
// listed type, from Publisher. Pages and members' notices have no feed.
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') ?? ''
  const format = getRouterParam(event, 'format')
  if (!isListedType(type) || (format !== 'rss' && format !== 'atom')) throw contentNotFound()
  let feed: string
  try {
    feed = await getPublisherFeed({ siteId: SITE_ID, type, format, origin: getRequestURL(event).origin })
  }
  catch (error) {
    throw contentError(error)
  }
  setResponseHeader(event, 'content-type', `application/${format === 'rss' ? 'rss' : 'atom'}+xml; charset=utf-8`)
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return feed
})
