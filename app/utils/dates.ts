import { SITE_TIME_ZONE } from '#shared/content'

// Dates and times as the islands keep them, the same on the server and in the browser.

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: SITE_TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: SITE_TIME_ZONE, weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** A start and end, as "Sat 2 November, 19:30 to 22:00", or over days when they differ. */
export function formatSpan(startsAt: string, endsAt: string | undefined, locale: string): string {
  const start = formatDateTime(startsAt, locale)
  if (!endsAt) return start
  const sameDay = formatDate(startsAt, locale) === formatDate(endsAt, locale)
  const end = sameDay
    ? new Intl.DateTimeFormat(locale, { timeZone: SITE_TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(endsAt))
    : formatDateTime(endsAt, locale)
  return `${start} – ${end}`
}
