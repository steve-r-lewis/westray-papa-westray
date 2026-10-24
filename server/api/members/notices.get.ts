import { SITE_ID } from '#shared/content'

// GET /api/members/notices — the published members' notices, newest first, for a
// signed-in member only: someone with their second step done, whose account is
// active. Notices have no address and no feed, and nothing else serves them; anyone
// else is told only to sign in.
export default defineEventHandler(async (event) => {
  const principal = await requireAuthenticatedPrincipal(event)
  if (principal.standing !== 'allowed') throw createError({ statusCode: 403, statusMessage: 'account-restricted', data: { code: 'account-restricted' } })
  setResponseHeader(event, 'cache-control', 'private, no-store')
  try {
    const { documents } = await listPublishedDocuments({ siteId: SITE_ID, type: 'members-notice', limit: 50 })
    const notices = await Promise.all(documents.map(document => getPublishedDocument({ siteId: SITE_ID, documentId: document.id })))
    return { notices: notices.filter(rendered => rendered !== null).map(rendered => contentPage(rendered)) }
  }
  catch (error) {
    throw contentError(error)
  }
})
