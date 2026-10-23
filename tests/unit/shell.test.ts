import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { shellSchema, type Shell } from '../../shared/shell'

const raw = JSON.parse(readFileSync(new URL('../../data/shell.json', import.meta.url), 'utf8'))
const shell: Shell = shellSchema.parse(raw)

// Routes built as pages, excluding dynamic ones such as the coming-soon catch-all.
const builtRoutes = readdirSync(new URL('../../app/pages', import.meta.url), { recursive: true, encoding: 'utf8' })
  .filter(file => file.endsWith('.vue') && !file.includes('['))
  .map(file => `/${file.replace(/\.vue$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/')

function allLinks(data: Shell) {
  return [
    ...data.header.links,
    data.header.signIn,
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

  it('links only to built pages, coming-soon pages or https addresses', () => {
    const known = new Set([...builtRoutes, ...shell.comingSoon.map(page => page.path)])
    const broken = allLinks(shell)
      .filter(link => link.to.startsWith('/') && !known.has(link.to))
      .map(link => link.to)
    expect(broken).toEqual([])
  })

  it('does not list a built page as coming soon', () => {
    const built = new Set(builtRoutes)
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
