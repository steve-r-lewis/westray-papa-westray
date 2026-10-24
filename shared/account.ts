// What the sign-in and account pages know of the IAM suite's vocabulary, for the
// shell's words (shared/shell.ts) and the pages.

// Every refusal Authentication, Identity and Profile may answer with; the shell words
// each one for the person.
export const ACCOUNT_ERROR_CODES = [
  'invalid-credentials',
  'mfa-required',
  'invalid-mfa-code',
  'email-not-verified',
  'password-rejected',
  'invalid-or-expired-token',
  'reauthentication-required',
  'insufficient-assurance',
  'account-restricted',
  'unauthenticated',
  'session-expired',
  'rate-limited',
  'origin-rejected',
  'validation-failed',
  'forbidden',
  'credential-limit-reached',
  'conflict',
  'unavailable',
] as const

export type AccountErrorCode = (typeof ACCOUNT_ERROR_CODES)[number]

export function isAccountErrorCode(value: unknown): value is AccountErrorCode {
  return typeof value === 'string' && (ACCOUNT_ERROR_CODES as readonly string[]).includes(value)
}

/** An identity's states, as Identity names them. */
export const IDENTITY_STATES = ['active', 'paused', 'suspended', 'closure-pending', 'closed', 'pending'] as const

/** The parts of a person's own record the profile page offers, as Profile names them. */
export const PROFILE_FIELDS = ['name', 'given_name', 'family_name', 'preferred_username', 'email', 'phone_number'] as const

export type ProfileField = (typeof PROFILE_FIELDS)[number]
