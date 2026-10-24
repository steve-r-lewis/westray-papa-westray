import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { AuthenticationMailer, AuthenticationMessage } from '@nuxt4-layers/authentication/contracts'
import type { ProfileNotifier } from '@nuxt4-layers/profile/contracts'
import nodemailer from 'nodemailer'
import type { Shell } from '../../shared/shell'

// The site's email: Authentication's messages (verification links, password resets,
// security notices) and Profile's contact-verification codes. Their words are shell
// data (`mail` in data/shell.json). How they leave is the deployment's choice:
//
//   MAIL_TRANSPORT=smtp        through SMTP_URL, from MAIL_FROM
//   MAIL_TRANSPORT=directory   one JSON file per message in MAIL_DIRECTORY, for a
//                              local copy and the tests; never on a real deployment
//
// Links and codes are secrets: nothing here logs a message.

export interface MailMessage {
  to: string
  subject: string
  text: string
}

export interface MailTransport {
  send(message: MailMessage & { kind: string }): Promise<void>
}

export function mailTransport(env: Readonly<Record<string, string | undefined>> = process.env): MailTransport {
  const transport = env.MAIL_TRANSPORT?.trim() || ''
  if (transport === 'directory') {
    const directory = env.MAIL_DIRECTORY?.trim()
    if (!directory) throw new TypeError('MAIL_TRANSPORT=directory needs MAIL_DIRECTORY.')
    return {
      async send(message) {
        await mkdir(directory, { recursive: true })
        await writeFile(join(directory, `${Date.now()}-${randomUUID()}.json`), JSON.stringify(message, null, 2), { mode: 0o600 })
      },
    }
  }
  if (transport === 'smtp') {
    const url = env.SMTP_URL?.trim()
    const from = env.MAIL_FROM?.trim()
    if (!url || !from) throw new TypeError('MAIL_TRANSPORT=smtp needs SMTP_URL and MAIL_FROM.')
    const smtp = nodemailer.createTransport(url)
    return {
      async send({ to, subject, text }) {
        await smtp.sendMail({ from, to, subject, text })
      },
    }
  }
  // No transport: every message fails, which Authentication reports without saying so
  // to the person, and sign-up cannot be finished.
  return {
    async send() {
      throw new Error('No mail transport: set MAIL_TRANSPORT.')
    },
  }
}

const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (whole, name: string) => values[name] ?? whole)

function formatTime(instant: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London' }).format(new Date(instant))
}

/** Authentication's message, in the shell's words. */
export function authenticationMail(message: AuthenticationMessage, mail: Shell['mail']): MailMessage {
  const words = mail.messages[message.kind]
  const lines = [words.body]
  if (message.actionUrl) lines.push('', message.actionUrl)
  if (message.expiresAt) lines.push('', fill(mail.expires, { time: formatTime(message.expiresAt, message.locale) }))
  if (message.kind !== 'security-notification') lines.push('', mail.ignore)
  lines.push('', mail.signature)
  return { to: message.to, subject: words.subject, text: lines.join('\n') }
}

export function createAuthenticationMailer(deps: { transport: () => MailTransport, mail: () => Promise<Shell['mail']> }): AuthenticationMailer {
  return {
    async send(message) {
      await deps.transport().send({ kind: message.kind, ...authenticationMail(message, await deps.mail()) })
    },
  }
}

/** Profile's contact-verification codes, by email only: the site sends no text messages. */
export function createProfileNotifier(deps: { transport: () => MailTransport, mail: () => Promise<Shell['mail']> }): ProfileNotifier {
  return {
    async send(message) {
      if (message.channel !== 'email') throw new Error('The site sends no text messages.')
      const mail = await deps.mail()
      const words = mail.messages['contact-verification']
      const text = [fill(words.body, { code: message.code, minutes: String(Math.ceil(message.expiresInSeconds / 60)) }), '', mail.ignore, '', mail.signature].join('\n')
      await deps.transport().send({ kind: 'contact-verification', to: message.to, subject: words.subject, text })
    },
  }
}
