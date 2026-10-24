// GET /.well-known/security.txt (RFC 9116) — where to report a vulnerability, from
// Configuration's contact.security.
export default defineEventHandler(async (event) => {
  const values = (await getConfiguration({ keys: ['contact.security'], visibility: 'public' }))?.values ?? {}
  const text = securityTxt(values['contact.security'], getRequestURL(event).origin, new Date())
  if (!text) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  return text
})
