import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Shell } from '#shared/shell'
import ColourModeSwitch from '~/components/ColourModeSwitch.vue'
import SiteFooter from '~/components/SiteFooter.vue'
import SiteHeader from '~/components/SiteHeader.vue'
import SiteMenu from '~/components/SiteMenu.vue'
import ThemePicker from '~/components/ThemePicker.vue'
import DefaultLayout from '~/layouts/default.vue'
import ComingSoon from '~/pages/[...slug].vue'
import shellData from '~~/data/shell.json'

// Altered copies of the real data prove each label comes from data, not code.
const real = shellData as Shell
const shell: Shell = structuredClone(real)
shell.site.name = 'Test Isles'
shell.header.links = [{ label: 'Harbour', to: '/harbour' }]
shell.header.signIn = { label: 'Log on', to: '/sign-in' }
shell.navigation.groups = [{ label: 'Around', items: [{ label: 'Harbour', to: '/harbour', icon: 'trail' }] }]
shell.menu.groups = [{ label: 'Places', items: [{ label: 'Harbour', to: '/harbour' }] }]
shell.footer.copyright = '© Test Isles'
shell.labels.comingSoonTitle = 'Not yet'
shell.labels.modeDark = 'Night'
shell.themes.order = ['isles-winter', 'isles-summer']
shell.comingSoon = [{ path: '/harbour', title: 'Harbour' }, { path: '/sign-in', title: 'Log on' }]

registerEndpoint('/api/shell', () => shell)
registerEndpoint('/api/themes', () => [
  { id: 'isles-summer', name: 'Isles Summer', version: '1.0.0', ownership: { ownerType: 'user', ownerId: 'a' }, visibility: 'public', lifecycle: 'published' },
  { id: 'isles-winter', name: 'Isles Winter', version: '1.0.0', ownership: { ownerType: 'user', ownerId: 'a' }, visibility: 'public', lifecycle: 'published' },
])

const { useRoute } = vi.hoisted(() => ({ useRoute: vi.fn(() => ({ path: '/harbour', fullPath: '/harbour' })) }))
mockNuxtImport('useRoute', () => useRoute)

async function withShell() {
  await loadShell()
}

afterEach(() => {
  useMember().value = null
})

describe('shell components', () => {
  it('header draws the site name, links and sign-in from data', async () => {
    await withShell()
    const header = await mountSuspended(SiteHeader, { props: { menuOpen: false } })
    expect(header.text()).toContain('Test Isles')
    expect(header.find('nav a').text()).toBe('Harbour')
    expect(header.find('nav a').attributes('href')).toBe('/harbour')
    expect(header.find('a[href="/sign-in"]').text()).toBe('Log on')
  })

  it('offers the side menu only to a signed-in member', async () => {
    await withShell()
    const signedOut = await mountSuspended(DefaultLayout)
    expect(signedOut.find('button[aria-controls="site-menu"]').exists()).toBe(false)
    expect(signedOut.find('dialog#site-menu').exists()).toBe(false)

    useMember().value = { id: 'member-1', displayName: 'A Member' }
    const signedIn = await mountSuspended(DefaultLayout)
    expect(signedIn.find('button[aria-controls="site-menu"]').attributes('aria-expanded')).toBe('false')
    expect(signedIn.find('dialog#site-menu').exists()).toBe(true)
    expect(signedIn.find('a[href="/sign-in"]').exists()).toBe(false)
  })

  it('menu draws groups from data and opens the group holding the current page', async () => {
    await withShell()
    const menu = await mountSuspended(SiteMenu, { props: { open: false } })
    expect(menu.find('summary').text()).toBe('Places')
    expect(menu.find('details').attributes('open')).toBeDefined()
    expect(menu.text()).toContain('Buy me a Coffee')
  })

  it('footer draws the site map, its text and links from data', async () => {
    await withShell()
    const footer = await mountSuspended(SiteFooter)
    expect(footer.find('h3').text()).toBe('Around')
    expect(footer.find('section a').attributes('href')).toBe('/harbour')
    expect(footer.text()).toContain('© Test Isles')
    expect(footer.find('a[href^="https://github.com/"]').text()).toBe(real.footer.social[0]!.label)
  })

  it('theme picker lists the visible themes in the shell order', async () => {
    await withShell()
    const picker = await mountSuspended(ThemePicker)
    expect(picker.findAll('option').map(option => option.text())).toEqual(['Isles Winter', 'Isles Summer'])
  })

  it('colour mode switch labels its choices from data and marks the current one', async () => {
    await withShell()
    const modes = await mountSuspended(ColourModeSwitch)
    const buttons = modes.findAll('button')
    expect(buttons.map(button => button.attributes('title'))).toEqual([real.labels.modeSystem, real.labels.modeLight, 'Night'])
    expect(buttons[0]!.attributes('aria-pressed')).toBe('true')
    await buttons[2]!.trigger('click')
    expect(buttons[2]!.attributes('aria-pressed')).toBe('true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('a page not built yet says so, in words from data', async () => {
    await withShell()
    const page = await mountSuspended(ComingSoon)
    expect(page.find('h1').text()).toBe('Harbour')
    expect(page.text()).toContain('Not yet')
  })
})
