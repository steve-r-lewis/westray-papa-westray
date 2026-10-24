import { SITE_ID } from '#shared/content'

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// GET /sitemap.xml — the home page, the section pages and the Contact page, then
// every published document of a public type that has an address, from Publisher.
export default defineEventHandler(async (event) => {
  const origin = getRequestURL(event).origin
  const shell = await readShell()
  let documents
  try {
    documents = (await listPublisherSitemapEntries({ siteId: SITE_ID })).filter(entry => isPublicType(entry.type))
  }
  catch (error) {
    throw contentError(error)
  }
  const pages = ['/', '/contact', ...shell.sections.map(section => section.path)]
    .filter(path => !documents.some(entry => entry.path === path))
    .map(path => ({ path, lastModified: null as string | null }))
  const urls = [...pages, ...documents].map(entry =>
    `  <url><loc>${escape(origin + entry.path)}</loc>${entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ''}</url>`)
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
})
