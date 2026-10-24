import { createHmac, randomBytes } from 'node:crypto'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch } from '@nuxt/test-utils/e2e'
import pg from 'pg'
import postgres from 'postgres'
import { afterAll } from 'vitest'
import type { ContentSource } from '../../server/database/content-files'
import { migrate, readMigrations } from '../../server/database/migrate'
import { seedContent } from '../../server/database/seed-content'
import { migrateIdentity, readPlatformFile, seedPlatform, type Platform } from '../../server/database/seed-platform'
import { readPalettes, seedThemes } from '../../server/database/seed-themes'

export const root = fileURLToPath(new URL('../..', import.meta.url))

// The runtime role every test database shares: roles belong to the server, not to a
// database. Identity and Profile serve requests as it, as on a deployment.
const RUNTIME_ROLE = { name: 'wpw_test_runtime', password: 'wpw_test_runtime' }
const SUPER_ADMIN_REQUEST = '01900000-0000-7000-8000-000000000001'

export interface TestSite {
  /** The built site's environment, for `setup()`. */
  env: Record<string, string>
  /** The port the site listens on, for `setup()`: the IAM layers check every change's origin. */
  port: number
  origin: string
  /** Where the site's email lands, one JSON file per message. */
  mailDirectory: string
  platform: Platform
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => (typeof address === 'object' && address ? resolve(address.port) : reject(new Error('no port'))))
    })
  })
}

/**
 * A database of the test's own beside DATABASE_URL's, migrated, provisioned in
 * Identity and seeded with the given content, and dropped after the tests, with the
 * environment the built site runs with. Call before `setup()`, so it is dropped after
 * the server stops.
 */
export async function testSite(name: string, sources: ContentSource[], env: Record<string, string> = {}): Promise<TestSite> {
  const admin = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, onnotice: () => {} })
  const database = `wpw_${name}_${process.pid}_${Date.now()}`
  await admin.unsafe(`create database "${database}"`)
  const mailDirectory = await mkdtemp(join(tmpdir(), `wpw-${name}-mail-`))
  afterAll(async () => {
    await admin.unsafe(`drop database if exists "${database}" with (force)`)
    await admin.end()
    await rm(mailDirectory, { recursive: true, force: true })
  })
  const url = new URL(process.env.DATABASE_URL!)
  url.pathname = `/${database}`
  const runtimeUrl = new URL(url)
  runtimeUrl.username = RUNTIME_ROLE.name
  runtimeUrl.password = RUNTIME_ROLE.password

  const sql = postgres(url.href, { prepare: false, max: 1, onnotice: () => {} })
  const owner = new pg.Pool({ connectionString: url.href, max: 2 })
  const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 2 })
  let platform: Platform
  try {
    await migrate(sql, await readMigrations([{ name: 'app', directory: `${root}server/database/migrations` }]))
    await migrateIdentity(sql, owner, RUNTIME_ROLE)
    ;({ platform } = await seedPlatform(sql, { owner, runtime }, { platform: await readPlatformFile(`${root}data/platform.json`), superAdminRequestId: SUPER_ADMIN_REQUEST }))
    await seedThemes(sql, await readPalettes(`${root}data/themes`), { superAdminId: platform.superAdminId })
    await seedContent(owner, sources, { today: new Date() })
  }
  finally {
    await sql.end()
    await owner.end()
    await runtime.end()
  }

  const port = await freePort()
  const origin = `http://127.0.0.1:${port}`
  return {
    port,
    origin,
    mailDirectory,
    platform,
    env: {
      DATABASE_URL: url.href,
      DATABASE_RUNTIME_URL: runtimeUrl.href,
      NUXT_AUTHENTICATION_SECRET: randomBytes(32).toString('base64url'),
      NUXT_AUTHENTICATION_BASE_URL: origin,
      NUXT_IDENTITY_BASE_URL: origin,
      NUXT_PROFILE_BASE_URL: origin,
      NUXT_AUTHORISATION_BASE_URL: origin,
      PROFILE_KEYS: `test=${randomBytes(32).toString('base64')}`,
      PROFILE_KEY_VERSION: 'test',
      MAIL_TRANSPORT: 'directory',
      MAIL_DIRECTORY: mailDirectory,
      DEMO_MODE: 'false',
      ...env,
    },
  }
}

/** A browser's cookies, kept between requests. */
export class Browser {
  private readonly cookies = new Map<string, string>()

  constructor(private readonly origin: string) {}

  get cookie(): string {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ')
  }

  async request(path: string, init: { method?: string, body?: unknown, accept?: string } = {}) {
    const headers: Record<string, string> = { accept: init.accept ?? 'application/json', origin: this.origin }
    if (this.cookies.size > 0) headers.cookie = this.cookie
    if (init.body !== undefined) headers['content-type'] = 'application/json'
    const response = await fetch(path, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      redirect: 'manual',
    })
    for (const line of response.headers.getSetCookie()) {
      const [pair] = line.split(';')
      const at = pair!.indexOf('=')
      const name = pair!.slice(0, at).trim()
      const value = pair!.slice(at + 1).trim()
      if (value === '' || /max-age=0/i.test(line)) this.cookies.delete(name)
      else this.cookies.set(name, value)
    }
    return response
  }

  async json<T>(path: string, init: { method?: string, body?: unknown } = {}): Promise<T> {
    const response = await this.request(path, init)
    if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${response.status} ${await response.text()}`)
    return (response.status === 204 ? null : await response.json()) as T
  }
}

/** The current code of an authenticator app holding this base32 secret (RFC 6238). */
export function totp(secret: string, at = Date.now()): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const bits = [...secret.replace(/=+$/, '').toUpperCase()].map(char => alphabet.indexOf(char).toString(2).padStart(5, '0')).join('')
  const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => Number.parseInt(byte, 2)))
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 30_000)))
  const digest = createHmac('sha1', key).update(counter).digest()
  const offset = digest[digest.length - 1]! & 15
  return String((digest.readUInt32BE(offset) & 0x7FFFFFFF) % 1_000_000).padStart(6, '0')
}

/** The link in the newest message to an address, once it has arrived. */
async function linkFor(mailDirectory: string, to: string, kind: string): Promise<string> {
  for (let tries = 0; tries < 50; tries++) {
    const messages = await Promise.all((await readdir(mailDirectory)).sort().map(async file => JSON.parse(await readFile(join(mailDirectory, file), 'utf8')) as { kind: string, to: string, text: string }))
    const message = messages.reverse().find(entry => entry.to === to && entry.kind === kind)
    const link = message?.text.match(/https?:\/\/\S+/)?.[0]
    if (link) return link
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`No ${kind} message to ${to}`)
}

/**
 * A member as a person becomes one: signs up, follows the emailed link, signs in and
 * sets up an authenticator app, finishing the second step the site requires. Their
 * browser is then signed in at aal2.
 */
export async function signUpMember(site: TestSite, email: string, password: string): Promise<{ browser: Browser, principalId: string }> {
  const browser = new Browser(site.origin)
  await browser.json('/api/authentication/sign-up', { method: 'POST', body: { email, password } })
  const link = new URL(await linkFor(site.mailDirectory, email, 'email-verification'))
  const verified = await browser.request(`${link.pathname}${link.search}`)
  if (verified.headers.get('location')?.includes('verification=success') !== true) throw new Error(`Verification failed: ${verified.headers.get('location')}`)
  await browser.json('/api/authentication/sign-in', { method: 'POST', body: { email, password } })
  const { totpUri } = await browser.json<{ totpUri: string }>('/api/authentication/mfa/totp/enrol', { method: 'POST', body: { password } })
  await browser.json('/api/authentication/mfa/totp/confirm', { method: 'POST', body: { code: totp(new URL(totpUri).searchParams.get('secret')!) } })
  const { principal } = await browser.json<{ principal: { principalId: string, assurance: { level: string } } | null }>('/api/authentication/session')
  if (principal?.assurance.level !== 'aal2') throw new Error('The member did not finish signing in')
  return { browser, principalId: principal.principalId }
}
