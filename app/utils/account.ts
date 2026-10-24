import type { AccountErrorCode } from '#shared/account'
import { isAccountErrorCode } from '#shared/account'

/** Fills `{name}` in a label from the shell. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole))
}

/**
 * The refusal behind a failed request to Identity's or Profile's API, which answer
 * with the code in the error's data; anything else is `unavailable`.
 */
export function accountErrorCode(error: unknown): AccountErrorCode {
  const body = (error as { data?: { data?: { code?: unknown }, statusMessage?: unknown } } | null)?.data
  const code = body?.data?.code ?? body?.statusMessage
  return isAccountErrorCode(code) ? code : 'unavailable'
}
