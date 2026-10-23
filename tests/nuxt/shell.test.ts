import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import type { Shell } from '#shared/shell'
import SiteFooter from '~/components/SiteFooter.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import SiteMenu from '~/components/SiteMenu.vue'
import ComingSoon from '~/pages/[...slug].vue'
import shellData from '~~/data/shell.json'

// Altered copies of the real data prove each label comes from data, not code.
const real = shellData as Shell
const shell: Shell = structuredClone(real)
shell.site.name = 'Test Isles'
shell.header.links = [{ label: 'Harbour', to: '/harbour' }]
shell.header.signIn = { label: 'Log on', to: '/sign-in' }
shell.menu.groups = [{ label: 'Places', items: [{ label: 'Harbour', to: '/harbour' }] }]
shell.footer.copyright = '© Test Isles'
shell.labels.comingSoonTitle = 'Not yet'
shell.comingSoon = [{ path: '/harbour', title: 'Harbour' }, { path: '/sign-in', title: 'Log on' }]

registerEndpoint('/api/shell', () => shell)

const { useRoute } = vi.hoisted(() => ({ useRoute: vi.fn(() => ({ path: '/harbour', fullPath: '/harbour' })) }))
mockNuxtImport('useRoute', () => useRoute)

async function withShell() {
  await loadShell()
}

describe('shell components', () => {
  it('header draws the site name, links and sign-in from data', async () => {
    await withShell()
    const header = await mountSuspended(SiteHeader, { props: { menuOpen: false } })
    expect(header.text()).toContain('Test Isles')
    expect(header.find('nav a').text()).toBe('Harbour')
    expect(header.find('nav a').attributes('href')).toBe('/harbour')
    expect(header.find('.sign-in').text()).toBe('Log on')
    expect(header.find('.menu-button').attributes('aria-expanded')).toBe('false')
  })

  it('menu draws groups from data and opens the group holding the current page', async () => {
    await withShell()
    const menu = await mountSuspended(SiteMenu, { props: { open: false } })
    expect(menu.find('summary').text()).toBe('Places')
    expect(menu.find('details').attributes('open')).toBeDefined()
    expect(menu.text()).toContain('Buy me a Coffee')
  })

  it('footer draws its text and links from data', async () => {
    await withShell()
    const footer = await mountSuspended(SiteFooter)
    expect(footer.find('.copyright').text()).toBe('© Test Isles')
    expect(footer.findAll('a').map(a => a.text())).toEqual(real.footer.links.map(link => link.label))
  })

  it('a page not built yet says so, in words from data', async () => {
    await withShell()
    const page = await mountSuspended(ComingSoon)
    expect(page.find('h1').text()).toBe('Harbour')
    expect(page.text()).toContain('Not yet')
  })
})
