import type { RichTextNode } from '@nuxt4-layers/rich-text'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import type { ContentPage } from '#shared/content'
import type { Shell } from '#shared/shell'
import ContentDocument from '~/components/ContentDocument.vue'
import DefaultLayout from '~/layouts/default.vue'
import DemoBanner from '~/components/DemoBanner.vue'
import HomePanel from '~/components/HomePanel.vue'
import RichText from '~/components/RichText.vue'
import CatchAll from '~/pages/[...slug].vue'
import ContactPage from '~/pages/contact.vue'
import shellData from '~~/data/shell.json'

const shell = structuredClone(shellData) as Shell
shell.labels.demoBanner = 'Demo only, opening {date}.'
shell.labels.demoDateToBeAnnounced = 'some day'
shell.sections = [{ path: '/harbour-news', title: 'Harbour news', intro: 'From the pier.', types: ['article'], order: 'latest', empty: 'Nothing yet.', feeds: true }]
shell.comingSoon = []

let demo: Record<string, unknown> = {}
registerEndpoint('/api/shell', () => shell)
registerEndpoint('/api/configuration/public', () => ({
  values: {
    'site.name': 'Test Isles',
    'site.default-locale': 'en-GB',
    'organisation.legal-name': 'Isles Access Group',
    'contact.general': { email: 'hello@example.org' },
    'contact.security': { email: 'security@example.org', phone: '+441632960001' },
    ...demo,
  },
  provenance: {},
}))
registerEndpoint('/api/content/listing', () => ({
  cards: [{ id: '1', type: 'article', title: 'Pier mended', summary: 'At last.', path: '/articles/2026/10/20/pier', publishedAt: '2026-10-20T08:00:00Z' }],
}))

const page = (overrides: Partial<ContentPage> = {}): ContentPage => ({
  id: '01a17d16-ab09-783a-9939-c5eb24d214d9',
  type: 'page',
  title: 'About the isles',
  summary: 'A summary.',
  path: '/about',
  locale: 'en-GB',
  publishedAt: '2026-10-20T08:00:00Z',
  modifiedAt: '2026-10-20T08:00:00Z',
  fields: {},
  richText: [{ path: 'body', profile: 'document', nodes: [{ kind: 'paragraph', children: [{ kind: 'text', value: 'Hello from the isles.' }] }] }],
  links: { documents: {}, assets: {} },
  ...overrides,
})
registerEndpoint('/api/content/resolve', (event) => {
  const path = new URL(event.node.req.url!, 'http://x').searchParams.get('path')
  if (path === '/about') return { kind: 'document', page: page() }
  if (path === '/contact') return { kind: 'document', page: page({ title: 'Get in touch', path: '/contact' }) }
  event.node.res.statusCode = 404
  return { statusCode: 404, message: 'Not found' }
})

const { useRoute } = vi.hoisted(() => ({ useRoute: vi.fn(() => ({ path: '/about', fullPath: '/about' })) }))
mockNuxtImport('useRoute', () => useRoute)

async function load() {
  clearNuxtData()
  await Promise.all([loadShell(), loadSite()])
}

describe('rich text', () => {
  const links = { documents: { '01a17d16-ab09-783a-9939-c5eb24d214d9': '/policies/privacy', '01a17d16-ab09-783a-9939-c5eb24d214da': null }, assets: {} }

  it('draws the safe tree as elements, never as HTML', async () => {
    const nodes: RichTextNode[] = [
      { kind: 'heading', depth: 1, children: [{ kind: 'text', value: 'Title' }] },
      { kind: 'paragraph', children: [{ kind: 'text', value: '<script>alert(1)</script>' }, { kind: 'strong', children: [{ kind: 'text', value: 'bold' }] }] },
      { kind: 'list', ordered: true, start: 3, children: [{ kind: 'list-item', children: [{ kind: 'text', value: 'three' }] }] },
      { kind: 'table', align: [null, 'right'], rows: [[[{ kind: 'text', value: 'A' }], [{ kind: 'text', value: 'B' }]], [[{ kind: 'text', value: '1' }], [{ kind: 'text', value: '2' }]]] },
    ]
    const wrapper = await mountSuspended(RichText, { props: { nodes, links } })
    // Content headings start at h2: the page title is the h1.
    expect(wrapper.find('h2').text()).toBe('Title')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('p').text()).toContain('<script>alert(1)</script>')
    expect(wrapper.find('strong').text()).toBe('bold')
    expect(wrapper.find('ol').attributes('start')).toBe('3')
    expect(wrapper.find('thead th').text()).toBe('A')
    expect(wrapper.findAll('tbody td')[1]!.classes()).toContain('text-right')
  })

  it('links documents to their current address, or leaves the text when they are not published', async () => {
    const nodes: RichTextNode[] = [{ kind: 'paragraph', children: [
      { kind: 'document-link', documentId: '01a17d16-ab09-783a-9939-c5eb24d214d9', children: [{ kind: 'text', value: 'privacy' }] },
      { kind: 'document-link', documentId: '01a17d16-ab09-783a-9939-c5eb24d214da', children: [{ kind: 'text', value: 'hidden' }] },
      { kind: 'link', href: 'https://example.org/', children: [{ kind: 'text', value: 'away' }] },
    ] }]
    const wrapper = await mountSuspended(RichText, { props: { nodes, links } })
    expect(wrapper.find('a[href="/policies/privacy"]').text()).toBe('privacy')
    expect(wrapper.find('span').text()).toBe('hidden')
    expect(wrapper.find('a[href="https://example.org/"]').attributes('rel')).toBe('noopener')
  })

  it('draws an image only when the asset store knows it', async () => {
    const nodes: RichTextNode[] = [{ kind: 'image', assetId: 'puffin', alt: 'A puffin' }, { kind: 'image', assetId: 'gone', alt: 'Gone' }]
    const wrapper = await mountSuspended(RichText, { props: { nodes, links: { documents: {}, assets: { puffin: { url: '/a/puffin.jpg' }, gone: null } } } })
    expect(wrapper.findAll('img').map(image => image.attributes('alt'))).toEqual(['A puffin'])
  })
})

describe('documents', () => {
  it('draw an event\'s time, place and organiser in the islands\' time', async () => {
    await load()
    const wrapper = await mountSuspended(ContentDocument, { props: { page: page({
      type: 'event',
      title: 'Regatta',
      fields: { startsAt: '2026-07-01T13:00:00.000Z', endsAt: '2026-07-01T16:00:00.000Z', venue: 'The pier', organiser: 'Isles Sailing Club' },
    }) } })
    expect(wrapper.find('h1').text()).toBe('Regatta')
    expect(wrapper.find('dl').text()).toContain('14:00 – 17:00')
    expect(wrapper.find('dl').text()).toContain('The pier')
    expect(wrapper.find('dl').text()).toContain('Isles Sailing Club')
  })

  it('a page shows its text, and no summary or dates', async () => {
    await load()
    const wrapper = await mountSuspended(ContentDocument, { props: { page: page() } })
    expect(wrapper.text()).toContain('Hello from the isles.')
    expect(wrapper.text()).not.toContain('A summary.')
    expect(wrapper.find('dl').exists()).toBe(false)
  })
})

describe('the catch-all page', () => {
  it('draws a section\'s listing, with its feeds', async () => {
    await load()
    useRoute.mockReturnValue({ path: '/harbour-news', fullPath: '/harbour-news' })
    const wrapper = await mountSuspended(CatchAll)
    useRoute.mockReturnValue({ path: '/about', fullPath: '/about' })
    expect(wrapper.find('h1').text()).toBe('Harbour news')
    expect(wrapper.find('a[href="/articles/2026/10/20/pier"]').text()).toBe('Pier mended')
    expect(wrapper.find('a[href="/feeds/article/atom"]').exists()).toBe(true)
  })

  it('draws what Publisher has published at the address', async () => {
    await load()
    const wrapper = await mountSuspended(CatchAll)
    expect(wrapper.find('h1').text()).toBe('About the isles')
  })
})

describe('home panels', () => {
  it('list a section\'s documents in place of "coming soon"', async () => {
    await load()
    const wrapper = await mountSuspended(HomePanel, { props: { panel: { title: 'News', description: 'News.', icon: 'article', links: [], section: '/harbour-news' } } })
    expect(wrapper.text()).toContain('Pier mended')
    expect(wrapper.text()).not.toContain(shell.labels.comingSoonTitle)
  })
})

describe('the Contact page', () => {
  it('shows Publisher\'s words, then the organisation and each role\'s contact from Configuration', async () => {
    await load()
    const wrapper = await mountSuspended(ContactPage)
    expect(wrapper.find('h1').text()).toBe('Get in touch')
    expect(wrapper.text()).toContain('Isles Access Group')
    expect(wrapper.find('a[href="mailto:hello@example.org"]').exists()).toBe(true)
    expect(wrapper.find('a[href="tel:+441632960001"]').exists()).toBe(true)
    expect(wrapper.text()).toContain(shell.contact.roles.general)
    expect(wrapper.text()).toContain(shell.contact.roles.security)
    // No data-protection contact is configured here, so that role is not listed.
    expect(wrapper.text()).not.toContain(shell.contact.roles['data-protection'])
    expect(wrapper.find('a[href="/.well-known/security.txt"]').exists()).toBe(true)
  })
})

describe('demonstration mode', () => {
  it('puts the banner on every page, with the launch date', async () => {
    demo = { 'demo.enabled': true, 'demo.launch-date': '2027-03-01' }
    await load()
    const layout = await mountSuspended(DefaultLayout)
    expect(layout.find('[role="note"]').text()).toBe('Demo only, opening 1 March 2027.')
    demo = {}
  })

  it('says the date is to be announced when none is set', async () => {
    demo = { 'demo.enabled': true, 'demo.launch-date': null }
    await load()
    const banner = await mountSuspended(DemoBanner)
    expect(banner.text()).toBe('Demo only, opening some day.')
    demo = {}
  })

  it('shows no banner on the real site', async () => {
    await load()
    const layout = await mountSuspended(DefaultLayout)
    expect(layout.find('[role="note"]').exists()).toBe(false)
  })
})
