import type { AuthenticationResult } from '@nuxt4-layers/authentication/contracts'

// Sensitive changes need a recent sign-in. When Authentication answers
// `reauthentication-required`, the page asks for the password (ReauthenticateForm)
// and, once confirmed, runs the change again.
export function useReauthentication() {
  const pending = shallowRef<(() => Promise<unknown>) | null>(null)

  async function guarded<T>(action: () => Promise<AuthenticationResult<T>>): Promise<AuthenticationResult<T>> {
    const result = await action()
    if (!result.ok && result.code === 'reauthentication-required') pending.value = action
    return result
  }

  async function confirmed() {
    const action = pending.value
    pending.value = null
    await action?.()
  }

  return { pending, guarded, confirmed, cancel: () => (pending.value = null) }
}
