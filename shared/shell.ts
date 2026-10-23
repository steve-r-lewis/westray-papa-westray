import { z } from 'zod'

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
}).strict()

export const shellMenuGroupSchema = z.object({
  label: text,
  items: z.array(shellLinkSchema).min(1),
}).strict()

// A page whose capability is not built yet says so; nothing is mocked.
// Each slice removes its pages from this list as it builds them.
export const comingSoonPageSchema = z.object({
  path: z.string().regex(/^\/(?!\/)[^?#]*$/, 'must be a path starting with "/"'),
  title: text,
}).strict()

export const shellSchema = z.object({
  site: z.object({
    name: text,
    tagline: text,
    // The drawer shows the name across lines, as on the mock-up.
    nameLines: z.array(text).min(1),
    locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
    logo: z.object({ src: href, alt: z.string() }).strict(),
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
