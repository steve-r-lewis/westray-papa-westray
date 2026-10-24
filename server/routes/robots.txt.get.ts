// GET /robots.txt — a demonstration deployment disallows everything; the real site
// allows everything and points at its sitemap.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return robotsTxt((await readDemoMode()).enabled, getRequestURL(event).origin)
})
