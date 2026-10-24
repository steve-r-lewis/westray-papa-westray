import { readdirSync, readFileSync } from 'node:fs'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { readContentFiles, resolveWhen } from '../../server/database/content-files'
import { root, testDatabase } from './support'

// Canary leak tests. Content nobody may see anonymously (drafts, scheduled and
// archived documents, a published document's newer draft, and members' notices)
// carries a unique canary string. The built site runs on a database of its own,
// holding that content beside the real pages, and anonymous requests to every page,
// API, feed, sitemap and error response must never show any canary. A hidden
// document's address must also answer exactly as an address that never held one.
//
// Needs DATABASE_URL, as a role that may create databases; skipped without it.

const fixtures = `${root}tests/fixtures/canaries`
const canaries = readdirSync(fixtures)
  .flatMap(file => readFileSync(`${fixtures}/${file}`, 'utf8').match(/CANARY-[a-z-]+-[0-9a-f]{8}/g) ?? [])
  .filter((canary, index, all) => all.indexOf(canary) === index)
// Any canary at all, including one of these with its suffix cut off.
const CANARY = /canary/i

// Addresses of documents a reader may not see, and of nothing at all.
// Dated addresses take the day a document was first published, or for a draft today.
const day = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '/')
const hidden = [
  '/hidden-draft-page', '/hidden-scheduled-page', '/events/hidden-scheduled-event',
  '/workshops/hidden-draft-workshop', '/creative-trail/hidden-draft-stop',
  `/articles/${day(new Date())}/hidden-draft-article`,
  `/blog/${day(resolveWhen({ days: -2 }, new Date()))}/hidden-archived-post`,
]
const MISSING = '/never-anything-here'

const url = process.env.DATABASE_URL

if (url) {
  const database = await testDatabase('canary', [...await readContentFiles(`${root}data/content`), ...await readContentFiles(fixtures)])
  await setup({
    rootDir: root,
    server: true,
    build: true,
    setupTimeout: 600_000,
    env: { DATABASE_URL: database, DEMO_MODE: 'false' },
  })
}

interface Answer { path: string, status: number, headers: string, body: string }

// As a browser asks (an error is then an HTML page), or as a script does (JSON).
async function get(path: string, accept = '*/*'): Promise<Answer> {
  const response = await fetch(path, { redirect: 'manual', headers: { accept } })
  const headers = [...response.headers].map(([name, value]) => `${name}: ${value}`).join('\n')
  return { path, status: response.status, headers, body: await response.text() }
}

function expectNoCanary(answer: Answer) {
  for (const canary of canaries) expect(answer.body, `${answer.path} shows ${canary}`).not.toContain(canary)
  expect(answer.body, `${answer.path} shows a canary`).not.toMatch(CANARY)
  expect(answer.headers, `${answer.path} has a canary in its headers`).not.toMatch(CANARY)
}

// Same-origin links in a page or feed, as paths.
function linksIn(body: string): string[] {
  const found = new Set<string>()
  for (const [, href] of body.matchAll(/(?:href|src)="([^"]+)"|<loc>([^<]+)<\/loc>|<link>([^<]+)<\/link>/g)) {
    if (!href) continue
    const link = href.replace(/^https?:\/\/[^/]+/, '')
    if (link.startsWith('/') && !link.startsWith('//') && !link.startsWith('/_nuxt/')) found.add(link.split('#')[0]!)
  }
  return [...found]
}

describe.skipIf(!url)('anonymous readers never see hidden content', () => {
  it('has canaries to look for', () => {
    expect(canaries.length).toBeGreaterThanOrEqual(9)
  })

  it('on any page, API, feed, sitemap or error response', { timeout: 300_000 }, async () => {
    const start = [
      '/', '/about', '/contact', '/policies', '/news', '/articles', '/blog', '/whats-on', '/events', '/workshops', '/creative-trail',
      '/sitemap.xml', '/robots.txt', '/.well-known/security.txt',
      '/api/shell', '/api/configuration/public', '/api/themes',
      ...['article', 'blog-post', 'event', 'workshop', 'creative-trail-stop', 'members-notice', 'page'].flatMap(type => [`/feeds/${type}/rss`, `/feeds/${type}/atom`]),
      ...['/news', '/articles', '/blog', '/whats-on', '/events', '/workshops', '/creative-trail'].map(section => `/api/content/listing?section=${section}`),
      // Hidden addresses, as pages and through the content API.
      ...hidden, ...hidden.map(path => `/api/content/resolve?path=${path}`),
      // Errors.
      MISSING, '/api/content/resolve', '/api/content/listing?section=/nowhere', '/feeds/nothing/rss',
      // Publisher's own API is switched off, so none of it answers.
      '/api/publisher/resolve?path=/hidden-draft-page&preview=1', '/api/publisher/documents?type=members-notice',
      '/api/publisher/feeds/members-notice/rss', '/api/publisher/feeds/article/atom', '/api/publisher/admin/documents?type=page',
    ]
    const seen = new Set<string>()
    const queue = [...start]
    while (queue.length > 0 && seen.size < 400) {
      const path = queue.shift()!
      if (seen.has(path)) continue
      seen.add(path)
      const answer = await get(path, 'text/html')
      expectNoCanary(answer)
      expectNoCanary(await get(path))
      if (answer.status === 200) queue.push(...linksIn(answer.body).filter(link => !seen.has(link)))
      // Every published document is also asked for through the content API.
      if (path.endsWith('.xml')) queue.push(...linksIn(answer.body).map(link => `/api/content/resolve?path=${link}`))
    }
    // The crawl reached the real pages and the public fixtures, through their links.
    expect(seen).toContain('/policies/privacy-policy')
    expect(seen).toContain('/events/public-event')
    for (const path of start.filter(path => path.startsWith('/api/publisher/'))) {
      expect((await get(path)).status, path).toBe(404)
    }
  })

  it('shows the published version of a document with a newer draft', async () => {
    const page = await get((await get('/api/content/listing?section=/articles')).body.match(/"path":\s*"([^"]+published-with-draft)"/)![1]!)
    expect(page.status).toBe(200)
    expect(page.body).toContain('A published article')
    expectNoCanary(page)
  })

  it('answers a hidden document exactly as a missing one', async () => {
    const same = (answer: Answer) => {
      // The address asked for is the one thing that may differ, as written or as a
      // page's payload escapes it.
      const asked = answer.path.replace(/^.*path=/, '')
      return {
        status: answer.status,
        body: answer.body.replaceAll(asked, '{path}').replaceAll(asked.replaceAll('/', '\\u002F'), '{path}'),
        type: answer.headers.match(/content-type: .*/)?.[0],
      }
    }
    for (const accept of ['text/html', '*/*']) {
      for (const prefix of ['', '/api/content/resolve?path=']) {
        const missing = same(await get(`${prefix}${MISSING}`, accept))
        expect(missing.status).toBe(404)
        for (const path of hidden) {
          expect(same(await get(`${prefix}${path}`, accept)), `${accept} ${prefix}${path}`).toEqual(missing)
        }
      }
    }
    const noFeed = same(await get('/feeds/nothing/rss'))
    for (const type of ['members-notice', 'page']) {
      expect(same(await get(`/feeds/${type}/rss`)), type).toEqual(noFeed)
    }
  })
})
