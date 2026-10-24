interface SecurityContact {
  email?: string
  phone?: string
  url?: string
  policy?: string
  encryption?: string
  acknowledgements?: string
  preferredLanguages?: string[]
}

// How long a served security.txt stays valid. RFC 9116 asks for an Expires under a
// year away; it is worked out afresh on every request, so it never lapses while the
// contact is configured.
const VALID_DAYS = 180

const absolute = (link: string, origin: string) => (link.startsWith('/') ? origin + link : link)

/** security.txt for Configuration's contact.security, or null when none is set. */
export function securityTxt(value: unknown, origin: string, now: Date): string | null {
  if (!value || typeof value !== 'object') return null
  const contact = value as SecurityContact
  const lines: string[] = []
  if (contact.email) lines.push(`Contact: mailto:${contact.email}`)
  if (contact.phone) lines.push(`Contact: tel:${contact.phone}`)
  if (contact.url) lines.push(`Contact: ${contact.url}`)
  if (lines.length === 0) return null
  const expires = new Date(now.getTime() + VALID_DAYS * 86_400_000)
  expires.setUTCHours(0, 0, 0, 0)
  lines.push(`Expires: ${expires.toISOString().replace('.000Z', 'Z')}`)
  if (contact.encryption) lines.push(`Encryption: ${contact.encryption}`)
  if (contact.acknowledgements) lines.push(`Acknowledgments: ${absolute(contact.acknowledgements, origin)}`)
  if (contact.policy) lines.push(`Policy: ${absolute(contact.policy, origin)}`)
  if (contact.preferredLanguages?.length) lines.push(`Preferred-Languages: ${contact.preferredLanguages.join(', ')}`)
  lines.push(`Canonical: ${origin}/.well-known/security.txt`)
  return `${lines.join('\n')}\n`
}
