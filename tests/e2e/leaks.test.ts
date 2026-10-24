import { readdirSync, readFileSync } from 'node:fs'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { readContentFiles, resolveWhen } from '../../server/database/content-files'
import { Browser, root, signUpMember, testSite } from './support'

// Canary leak tests. Content nobody may see anonymously (drafts, scheduled and
// archived documents, a published document's newer draft, and members' notices)
// carries a unique canary string. The built site runs on a database of its own,
// holding that content beside the real pages, and anonymous requests to every page,
// API, feed, sitemap and error response must never show any canary. A hidden
// document's address must also answer exactly as an address that never held one.
// Both hold again for a signed-in member who holds no role: signing in grants nothing
// until a role does.
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

let site: Awaited<ReturnType<typeof testSite>>
if (url) {
  site = await testSite('canary', [...await readContentFiles(`${root}data/content`), ...await readContentFiles(fixtures)])
  await setup({
    rootDir: root,
    server: true,
    build: true,
    setupTimeout: 600_000,
    port: site.port,
    env: site.env,
  })
}

interface Answer { path: string, status: number, headers: string, body: string }

// Who is asking: nobody, or a member's signed-in browser.
type Reader = Browser | null

// As a browser asks (an error is then an HTML page), or as a script does (JSON).
async function get(path: string, accept = '*/*', reader: Reader = null): Promise<Answer> {
  const response = reader
    ? await reader.request(path, { accept })
    : await fetch(path, { redirect: 'manual', headers: { accept } })
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

function neverShowsHiddenContent(reader: () => Promise<Reader>) {
  it('on any page, API, feed, sitemap or error response', { timeout: 300_000 }, async () => {
    const who = await reader()
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
      const answer = await get(path, 'text/html', who)
      expectNoCanary(answer)
      expectNoCanary(await get(path, '*/*', who))
      if (answer.status === 200) queue.push(...linksIn(answer.body).filter(link => !seen.has(link)))
      // Every published document is also asked for through the content API.
      if (path.endsWith('.xml')) queue.push(...linksIn(answer.body).map(link => `/api/content/resolve?path=${link}`))
    }
    // The crawl reached the real pages and the public fixtures, through their links.
    expect(seen).toContain('/policies/privacy-policy')
    expect(seen).toContain('/events/public-event')
    for (const path of start.filter(path => path.startsWith('/api/publisher/'))) {
      expect((await get(path, '*/*', who)).status, path).toBe(404)
    }
  })

  it('shows the published version of a document with a newer draft', async () => {
    const who = await reader()
    const page = await get((await get('/api/content/listing?section=/articles', '*/*', who)).body.match(/"path":\s*"([^"]+published-with-draft)"/)![1]!, '*/*', who)
    expect(page.status).toBe(200)
    expect(page.body).toContain('A published article')
    expectNoCanary(page)
  })

  it('answers a hidden document exactly as a missing one', async () => {
    const who = await reader()
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
        const missing = same(await get(`${prefix}${MISSING}`, accept, who))
        expect(missing.status).toBe(404)
        for (const path of hidden) {
          expect(same(await get(`${prefix}${path}`, accept, who)), `${accept} ${prefix}${path}`).toEqual(missing)
        }
      }
    }
    const noFeed = same(await get('/feeds/nothing/rss', '*/*', who))
    for (const type of ['members-notice', 'page']) {
      expect(same(await get(`/feeds/${type}/rss`, '*/*', who)), type).toEqual(noFeed)
    }
  })
}

describe.skipIf(!url)('anonymous readers never see hidden content', () => {
  it('has canaries to look for', () => {
    expect(canaries.length).toBeGreaterThanOrEqual(9)
  })

  neverShowsHiddenContent(async () => null)
})

describe.skipIf(!url)('a signed-in member with no roles never sees hidden content', () => {
  let member: Promise<Browser> | undefined
  // Signed up once, through the site, with the second step done.
  const signedIn = () => (member ??= signUpMember(site, 'member@example.org', 'a long passphrase for the canary tests').then(({ browser }) => browser))

  it('is signed in as a member', async () => {
    const page = await get('/account', 'text/html', await signedIn())
    expect(page.status).toBe(200)
    expect(page.body).toContain('id="site-menu"')
  })

  neverShowsHiddenContent(signedIn)
})
