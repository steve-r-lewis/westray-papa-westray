import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { shellSchema, type Shell } from '../../shared/shell'

const raw = JSON.parse(readFileSync(new URL('../../data/shell.json', import.meta.url), 'utf8'))
const shell: Shell = shellSchema.parse(raw)

// Routes built as pages, excluding dynamic ones such as the coming-soon catch-all.
const builtRoutes = readdirSync(new URL('../../app/pages', import.meta.url), { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('.vue') && !file.includes('['))
  .map(file => `/${file.replace(/\.vue$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/')

// Pages Publisher serves from the seeded content in data/content/.
const contentPages = readdirSync(new URL('../../data/content/pages', import.meta.url))
  .filter(file => file.endsWith('.json'))
  .map(file => `/${JSON.parse(readFileSync(new URL(`../../data/content/pages/${file}`, import.meta.url), 'utf8')).slug}`)

function allLinks(data: Shell) {
  return [
    ...data.header.links,
    data.header.signIn,
    ...data.home.panels.flatMap(panel => [...panel.links, ...(panel.to ? [{ label: panel.title, to: panel.to }] : [])]),
    ...data.menu.groups.flatMap(group => group.items),
    ...data.menu.footer,
    ...data.footer.links,
    ...data.home.actions,
  ]
}

function clone(): Shell {
  return structuredClone(shell)
}

describe('shell data', () => {
  it('meets the schema', () => {
    expect(shellSchema.safeParse(raw).success).toBe(true)
  })

  it('links only to built pages, sections, content, coming-soon pages or https addresses', () => {
    const known = new Set([...builtRoutes, ...contentPages, ...shell.sections.map(section => section.path), ...shell.comingSoon.map(page => page.path)])
    const broken = allLinks(shell)
      .filter(link => link.to.startsWith('/') && !known.has(link.to))
      .map(link => link.to)
    expect(broken).toEqual([])
  })

  it('does not list a built page, section or content page as coming soon', () => {
    const built = new Set([...builtRoutes, ...contentPages, ...shell.sections.map(section => section.path)])
    expect(shell.comingSoon.filter(page => built.has(page.path))).toEqual([])
  })
})

describe('shell schema', () => {
  it('rejects a link that is neither a path nor https', () => {
    for (const to of ['http://example.com', 'javascript:alert(1)', '//example.com', 'about', '']) {
      const data = clone()
      data.footer.links[0]!.to = to
      expect(shellSchema.safeParse(data).success, to).toBe(false)
    }
  })

  it('rejects an icon it does not know', () => {
    const data = clone() as unknown as { header: { links: Array<{ icon?: string }> } }
    data.header.links[0]!.icon = 'unicorn'
    expect(shellSchema.safeParse(data).success).toBe(false)
  })

  it('rejects an empty label', () => {
    const data = clone()
    data.header.links[0]!.label = '  '
    expect(shellSchema.safeParse(data).success).toBe(false)
  })

  it('rejects unknown fields, so a typo is not silently ignored', () => {
    expect(shellSchema.safeParse({ ...clone(), extra: true }).success).toBe(false)
  })

  it('rejects a page listed twice', () => {
    const data = clone()
    data.comingSoon.push({ ...data.comingSoon[0]! })
    expect(shellSchema.safeParse(data).success).toBe(false)
  })
})

describe('sections', () => {
  it('fill the What\'s on and News panels', () => {
    const panels = Object.fromEntries(shell.home.panels.map(panel => [panel.title, panel.section]))
    expect(panels['What\'s on']).toBe('/whats-on')
    expect(panels.News).toBe('/news')
  })

  it('reject a panel naming a section that does not exist', () => {
    const data = clone()
    data.home.panels[0]!.section = '/nowhere'
    expect(shellSchema.safeParse(data).success).toBe(false)
  })

  it('reject a section listed twice, or also listed as coming soon', () => {
    const twice = clone()
    twice.sections.push({ ...twice.sections[0]! })
    expect(shellSchema.safeParse(twice).success).toBe(false)
    const soon = clone()
    soon.comingSoon.push({ path: soon.sections[0]!.path, title: 'Soon' })
    expect(shellSchema.safeParse(soon).success).toBe(false)
  })

  it('reject a type that is not listed, such as pages or members\' notices', () => {
    for (const type of ['page', 'members-notice']) {
      const data = clone() as unknown as { sections: Array<{ types: string[] }> }
      data.sections[0]!.types = [type]
      expect(shellSchema.safeParse(data).success, type).toBe(false)
    }
  })

  it('reject a demonstration banner without a place for the launch date', () => {
    const data = clone()
    data.labels.demoBanner = 'Pre-launch demonstration'
    expect(shellSchema.safeParse(data).success).toBe(false)
  })
})
