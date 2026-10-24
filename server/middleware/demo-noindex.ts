// A demonstration deployment asks every search engine to leave every answer alone:
// pages, feeds, the API and files alike. Its pages also carry a robots meta tag.
export default defineEventHandler(async (event) => {
  if ((await readDemoMode()).enabled) setResponseHeader(event, 'x-robots-tag', 'noindex, nofollow')
})
