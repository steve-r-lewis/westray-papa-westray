import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { readContentFiles } from '../../server/database/content-files'
import { root, testSite } from './support'

// The pre-launch demonstration, built and run as its deployment would be: the
// banner on every page, nothing indexed, and the invented content listed.
// Needs DATABASE_URL, as a role that may create databases; skipped without it.

const url = process.env.DATABASE_URL

if (url) {
  const site = await testSite('demo', [...await readContentFiles(`${root}data/content`), ...await readContentFiles(`${root}data/demo`)], { DEMO_MODE: 'true', DEMO_LAUNCH_DATE: '2027-04-01' })
  await setup({
    rootDir: root,
    server: true,
    build: true,
    setupTimeout: 600_000,
    port: site.port,
    env: site.env,
  })
}

const BANNER = 'Pre-launch demonstration: everything here is fictitious; launches on 1 April 2027; at launch the site starts empty'

describe.skipIf(!url)('the demonstration deployment', () => {
  it('shows the banner on every page, and asks for none to be indexed', async () => {
    for (const path of ['/', '/about', '/news', '/whats-on', '/creative-trail', '/contact', '/never-anything-here']) {
      const response = await fetch(path, { headers: { accept: 'text/html' } })
      const html = await response.text()
      expect(html, path).toContain(BANNER)
      expect(html, path).toContain('<meta name="robots" content="noindex, nofollow">')
      expect(response.headers.get('x-robots-tag'), path).toBe('noindex, nofollow')
    }
  })

  it('asks for nothing else to be indexed either', async () => {
    for (const path of ['/sitemap.xml', '/feeds/article/rss', '/api/content/listing?section=/news', '/.well-known/security.txt']) {
      expect((await fetch(path)).headers.get('x-robots-tag'), path).toBe('noindex, nofollow')
    }
    expect(await (await fetch('/robots.txt')).text()).toBe('User-agent: *\nDisallow: /\n')
  })

  it('lists the invented content, with events still to come', async () => {
    const whatsOn = await (await fetch('/whats-on')).text()
    expect(whatsOn).toContain('Sailing club annual dinner')
    expect(whatsOn).toContain('Christmas craft fair')
    expect(await (await fetch('/news')).text()).toContain('Winter ferry timetable now out')
    expect(await (await fetch('/creative-trail')).text()).toContain('Harbour Pottery')
  })
})
