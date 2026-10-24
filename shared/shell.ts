import { z } from 'zod'
import { ACCOUNT_ERROR_CODES, IDENTITY_STATES, PROFILE_FIELDS } from './account'
import { LISTED_TYPES, LISTING_ORDERS } from './content'
import { iconNames } from './icons'

// The shell is everything around a page: header, side menu and footer.
// Every label and link in it is data; this schema is the contract that data meets.

const text = z.string().trim().min(1)

// A site path ("/news"): no query, fragment or trailing slash.
const sitePath = z.string().regex(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/, 'must be a path such as "/news"')

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
  // A section (below) whose newest or next few documents the panel lists.
  section: sitePath.optional(),
}).strict()

// A section page listing Publisher's documents: News, What's on, Events and the like.
export const sectionSchema = z.object({
  path: sitePath,
  title: text,
  intro: text,
  types: z.array(z.enum(LISTED_TYPES)).min(1),
  order: z.enum(LISTING_ORDERS),
  // Said when there is nothing to list.
  empty: text,
  // Links to the RSS and Atom feeds of each of its types.
  feeds: z.boolean().optional(),
}).strict()

// A set of named labels, each required: `words('title', 'intro')`.
function words<const K extends string>(...keys: K[]) {
  return z.strictObject(Object.fromEntries(keys.map(key => [key, text])) as Record<K, typeof text>)
}

// Every word on the sign-in and account pages. `{name}` marks a value filled in.
export const accountSchema = z.strictObject({
  fields: words('email', 'password', 'newPassword', 'currentPassword', 'code', 'backupCode', 'passkeyName'),
  passwordHint: text.refine(value => value.includes('{min}'), 'must contain {min}'),
  working: text,
  // What each refusal from Authentication, Identity or Profile says to the person.
  errors: z.strictObject(Object.fromEntries(ACCOUNT_ERROR_CODES.map(code => [code, text])) as Record<(typeof ACCOUNT_ERROR_CODES)[number], typeof text>),
  signIn: words('title', 'intro', 'submit', 'passkey', 'or', 'forgotPassword', 'noAccount', 'signUp', 'secondFactorTitle', 'secondFactorIntro', 'useBackupCode', 'useApp', 'continue', 'verified', 'verificationFailed', 'passwordReset'),
  signUp: words('title', 'intro', 'submit', 'sent', 'haveAccount', 'signIn'),
  forgotPassword: words('title', 'intro', 'submit', 'sent', 'backToSignIn'),
  resetPassword: words('title', 'intro', 'submit', 'missingToken'),
  secondFactor: words('title', 'intro', 'appTitle', 'appIntro', 'start', 'scan', 'key', 'confirm', 'backupCodesTitle', 'backupCodesIntro', 'done', 'passkeyTitle', 'passkeyIntro', 'addPasskey', 'stepUpTitle', 'stepUpIntro'),
  reauthenticate: words('title', 'intro', 'submit', 'cancel'),
  overview: z.strictObject({
    ...words('title', 'intro', 'status', 'groups', 'noGroups', 'signOut', 'pauseTitle', 'pauseIntro', 'pause', 'resume', 'pausedIntro', 'closeTitle', 'closeIntro', 'close', 'closeConfirm', 'closing', 'cancelClose').shape,
    states: z.strictObject(Object.fromEntries(IDENTITY_STATES.map(state => [state, text])) as Record<(typeof IDENTITY_STATES)[number], typeof text>),
  }),
  security: words('title', 'intro', 'passwordTitle', 'changePassword', 'passwordChanged', 'appTitle', 'appOn', 'appOff', 'setUpApp', 'backupCodesTitle', 'backupCodesLeft', 'newBackupCodes', 'passkeysTitle', 'noPasskeys', 'addPasskey', 'added', 'remove', 'sessionsTitle', 'thisDevice', 'signedInAt', 'signOutSession', 'signOutOthers', 'unknownDevice'),
  profile: z.strictObject({
    ...words('title', 'intro', 'details', 'audience', 'displayName', 'anonymiseOnDeparture', 'save', 'saved', 'download', 'unconfirmed').shape,
    attributes: z.strictObject(Object.fromEntries(PROFILE_FIELDS.map(field => [field, text])) as Record<(typeof PROFILE_FIELDS)[number], typeof text>),
    audiences: words('nobody', 'group', 'tenant'),
    displayNames: words('name', 'preferred_username', 'given_name'),
  }),
})

// The site's email, by message. `{time}`, `{code}` and `{minutes}` are filled in.
const mailMessage = words('subject', 'body')

export const mailSchema = z.strictObject({
  signature: text,
  expires: text.refine(value => value.includes('{time}'), 'must contain {time}'),
  ignore: text,
  messages: z.strictObject({
    'email-verification': mailMessage,
    'password-reset': mailMessage,
    'email-change-confirmation': mailMessage,
    'security-notification': mailMessage,
    'contact-verification': mailMessage.refine(message => message.body.includes('{code}'), 'body must contain {code}'),
  }),
})

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
    published: text,
    updated: text,
    when: text,
    where: text,
    organiser: text,
    stop: text,
    maker: text,
    feeds: text,
    rss: text,
    atom: text,
    // Each listed type's name, as a section with several types names its feeds.
    typeNames: z.record(z.enum(LISTED_TYPES), text),
    // The demonstration deployment's banner; {date} is the launch date.
    demoBanner: text.refine(value => value.includes('{date}'), 'must contain {date}'),
    demoDateToBeAnnounced: text,
  }).strict(),
  // The Contact page: the platform's organisation and contacts come from Configuration.
  contact: z.object({
    organisation: text,
    roles: z.object({
      'general': text,
      'data-protection': text,
      'security': text,
    }).strict(),
    email: text,
    phone: text,
    web: text,
    securityTxt: text,
  }).strict(),
  header: z.object({
    links: z.array(shellLinkSchema),
    signIn: shellLinkSchema,
    // Shown instead of Sign in to a signed-in member.
    account: shellLinkSchema,
  }).strict(),
  account: accountSchema,
  mail: mailSchema,
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
  sections: z.array(sectionSchema),
  comingSoon: z.array(comingSoonPageSchema),
}).strict().superRefine((shell, context) => {
  const sections = new Set<string>()
  shell.sections.forEach((section, index) => {
    if (sections.has(section.path)) {
      context.addIssue({ code: 'custom', path: ['sections', index, 'path'], message: `duplicate section ${section.path}` })
    }
    sections.add(section.path)
  })
  shell.home.panels.forEach((panel, index) => {
    if (panel.section && !sections.has(panel.section)) {
      context.addIssue({ code: 'custom', path: ['home', 'panels', index, 'section'], message: `no section ${panel.section}` })
    }
  })
  const paths = new Set<string>(sections)
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
export type Section = z.infer<typeof sectionSchema>
export type AccountWords = z.infer<typeof accountSchema>

export function isExternal(to: string): boolean {
  return /^https:\/\//.test(to)
}
