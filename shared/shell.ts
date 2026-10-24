import { z } from 'zod'
import { iconNames } from './icons'

// The shell is everything around a page: header, side menu and footer.
// Every label and link in it is data; this schema is the contract that data meets.

const text = z.string().trim().min(1)

// An internal path ("/about") or an absolute https:// address.
const href = z.string().refine(
  value => /^\/(?!\/)/.test(value) || /^https:\/\/[^\s]+$/.test(value),
  { message: 'must be a path starting with "/" or an https:// address' },
)

export const shellLinkSchema = z.object({
  label: text,
  to: href,
  // A short line under the label, as on the mock-up's coffee link.
  description: text.optional(),
  icon: z.enum(iconNames).optional(),
}).strict()

export const shellMenuGroupSchema = z.object({
  label: text,
  items: z.array(shellLinkSchema).min(1),
}).strict()

// A dashboard panel on the home page: one per section of the site, or a feature of
// its own. A panel whose content is not built yet shows its links and says so.
export const homePanelSchema = z.object({
  title: text,
  description: text,
  icon: z.enum(iconNames),
  // The section's own page, for the panel's "See all" link.
  to: href.optional(),
  links: z.array(shellLinkSchema),
  // Wide panels span two columns on large screens.
  wide: z.boolean().optional(),
}).strict()

// A page whose capability is not built yet says so; nothing is mocked.
// Each slice removes its pages from this list as it builds them.
export const comingSoonPageSchema = z.object({
  path: z.string().regex(/^\/(?!\/)[^?#]*$/, 'must be a path starting with "/"'),
  title: text,
}).strict()

export const shellSchema = z.object({
  // The site's name, tagline, locale, default theme and social links are
  // Configuration's (data/configuration.json); this holds only how the shell draws them.
  site: z.object({
    // The drawer shows the name across lines, as on the mock-up.
    nameLines: z.array(text).min(1),
    logo: z.object({ src: href, alt: z.string() }).strict(),
  }).strict(),
  themes: z.object({
    // The order the theme picker lists these in; any other public theme follows.
    order: z.array(z.string().regex(/^[a-z0-9-]{1,64}$/)),
  }).strict(),
  labels: z.object({
    skipToContent: text,
    openMenu: text,
    closeMenu: text,
    siteMenu: text,
    primaryNavigation: text,
    footerNavigation: text,
    share: text,
    linkCopied: text,
    appearance: text,
    seeAll: text,
    social: text,
    // The name of each social network Configuration may list, for screen readers.
    networks: z.record(z.string(), text),
    theme: text,
    colourMode: text,
    modeSystem: text,
    modeLight: text,
    modeDark: text,
    comingSoonTitle: text,
    comingSoonBody: text,
    notFoundTitle: text,
    notFoundBody: text,
    errorTitle: text,
    errorBody: text,
    backHome: text,
  }).strict(),
  header: z.object({
    links: z.array(shellLinkSchema),
    signIn: shellLinkSchema,
  }).strict(),
  // The side menu, for signed-in members only. It grows as members' features arrive.
  menu: z.object({
    groups: z.array(shellMenuGroupSchema).min(1),
    // Links pinned to the foot of the drawer.
    footer: z.array(shellLinkSchema),
  }).strict(),
  footer: z.object({
    copyright: text,
    links: z.array(shellLinkSchema),
  }).strict(),
  home: z.object({
    title: text,
    heading: text,
    intro: text,
    actions: z.array(shellLinkSchema).max(2),
    panels: z.array(homePanelSchema).min(1),
  }).strict(),
  comingSoon: z.array(comingSoonPageSchema),
}).strict().superRefine((shell, context) => {
  const paths = new Set<string>()
  shell.comingSoon.forEach((page, index) => {
    if (paths.has(page.path)) {
      context.addIssue({ code: 'custom', path: ['comingSoon', index, 'path'], message: `duplicate page ${page.path}` })
    }
    paths.add(page.path)
  })
})

export type Shell = z.infer<typeof shellSchema>
export type ShellLink = z.infer<typeof shellLinkSchema>
export type ComingSoonPage = z.infer<typeof comingSoonPageSchema>

export function isExternal(to: string): boolean {
  return /^https:\/\//.test(to)
}
