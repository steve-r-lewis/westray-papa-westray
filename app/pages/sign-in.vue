<script setup lang="ts">
import { safeRedirectPath } from '@nuxt4-layers/authentication/contracts'
import type { AccountErrorCode } from '#shared/account'

// Signing in: a password, then the second step if the account has one, or a passkey.
// Someone already signed in is sent on.
definePageMeta({ middleware: 'guest' })

const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const route = useRoute()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.signIn.title })

const email = ref('')
const password = ref('')
const code = ref('')
const step = ref<'password' | 'second-factor'>('password')
const method = ref<'totp' | 'backup-code'>('totp')
const busy = ref(false)
const error = ref<AccountErrorCode | null>(null)

// What the link that brought the person here says: a confirmed address, an expired
// confirmation link, or a new password.
const notice = computed(() => {
  if (route.query.verification === 'success') return { tone: 'success' as const, text: words.value.signIn.verified }
  if (route.query.verification === 'failed') return { tone: 'error' as const, text: words.value.signIn.verificationFailed }
  if (route.query.reset === 'done') return { tone: 'success' as const, text: words.value.signIn.passwordReset }
  return null
})

const destination = () => safeRedirectPath(route.query.redirect, routes.afterSignIn)

async function attempt<T>(action: () => Promise<{ ok: true, data: T } | { ok: false, code: AccountErrorCode }>) {
  busy.value = true
  error.value = null
  const result = await action()
  busy.value = false
  if (!result.ok) error.value = result.code
  return result
}

async function signIn() {
  const result = await attempt(() => auth.signIn(email.value, password.value))
  if (!result.ok) return
  password.value = ''
  if (result.data.status === 'second-factor-required') {
    method.value = result.data.methods.includes('totp') ? 'totp' : 'backup-code'
    step.value = 'second-factor'
    return
  }
  await navigateTo(destination())
}

async function verify() {
  const result = await attempt(() => auth.verifySecondFactor(method.value, code.value.replace(/\s+/g, '')))
  if (result.ok) await navigateTo(destination())
}

async function withPasskey() {
  const result = await attempt(() => auth.signInWithPasskey())
  if (result.ok) await navigateTo(destination())
}
</script>

<template>
  <PageCard :title="step === 'password' ? words.signIn.title : words.signIn.secondFactorTitle">
    <div class="flex max-w-md flex-col gap-4">
      <AppNotice v-if="notice && step === 'password'" :tone="notice.tone">{{ notice.text }}</AppNotice>
      <AccountError :code="error" />

      <template v-if="step === 'password'">
        <p>{{ words.signIn.intro }}</p>
        <form class="flex flex-col gap-3" @submit.prevent="signIn">
          <AppField v-model="email" :label="words.fields.email" type="email" autocomplete="username" required />
          <AppField v-model="password" :label="words.fields.password" type="password" autocomplete="current-password" required />
          <div>
            <AppButton :busy="busy">{{ words.signIn.submit }}</AppButton>
          </div>
        </form>
        <p><AppLink :to="routes.forgotPassword">{{ words.signIn.forgotPassword }}</AppLink></p>
        <p class="text-sm" aria-hidden="true">{{ words.signIn.or }}</p>
        <div>
          <AppButton variant="plain" type="button" :busy="busy" @click="withPasskey">{{ words.signIn.passkey }}</AppButton>
        </div>
        <p>
          {{ words.signIn.noAccount }}
          <AppLink :to="routes.signUp">{{ words.signIn.signUp }}</AppLink>
        </p>
      </template>

      <template v-else>
        <p>{{ words.signIn.secondFactorIntro }}</p>
        <form class="flex flex-col gap-3" @submit.prevent="verify">
          <AppField
            v-model="code"
            :label="method === 'totp' ? words.fields.code : words.fields.backupCode"
            autocomplete="one-time-code"
            :inputmode="method === 'totp' ? 'numeric' : 'text'"
            required
          />
          <div>
            <AppButton :busy="busy">{{ words.signIn.continue }}</AppButton>
          </div>
        </form>
        <div>
          <AppButton variant="plain" type="button" @click="method = method === 'totp' ? 'backup-code' : 'totp'; code = ''">
            {{ method === 'totp' ? words.signIn.useBackupCode : words.signIn.useApp }}
          </AppButton>
        </div>
      </template>
    </div>
  </PageCard>
</template>
