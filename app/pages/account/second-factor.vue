<script setup lang="ts">
import { safeRedirectPath } from '@nuxt4-layers/authentication/contracts'
import type { AccountErrorCode } from '#shared/account'

// Every member signs in with a second step. Someone signed in with a password alone
// comes here: with an authenticator app already set up they enter its code; otherwise
// they set one up (seeing their backup codes once) or add a passkey.
definePageMeta({ middleware: 'authentication-signed-in' })

const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const route = useRoute()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.secondFactor.title })

const destination = () => safeRedirectPath(route.query.redirect, routes.afterSignIn)
if (!auth.needsSecondFactor.value) await navigateTo(destination())

const { data: status } = await useAsyncData('account:mfa', async () => {
  const result = await auth.mfaStatus()
  return result.ok ? result.data : null
})

const password = ref('')
const code = ref('')
const enrolment = ref<{ totpUri: string, backupCodes: string[] } | null>(null)
const confirmed = ref(false)
const busy = ref(false)
const error = ref<AccountErrorCode | null>(null)

const secret = computed(() => (enrolment.value ? new URL(enrolment.value.totpUri).searchParams.get('secret') ?? '' : ''))

async function attempt(action: () => Promise<{ ok: true } | { ok: false, code: AccountErrorCode }>) {
  busy.value = true
  error.value = null
  const result = await action()
  busy.value = false
  if (!result.ok) error.value = result.code
  return result.ok
}

async function stepUp() {
  if (await attempt(() => auth.reauthenticate({ method: 'totp', code: code.value.replace(/\s+/g, '') }))) await navigateTo(destination())
}

async function startApp() {
  await attempt(async () => {
    // Setting up a factor needs a recent sign-in: the password renews it first.
    const renewed = await auth.reauthenticate({ method: 'password', password: password.value })
    if (!renewed.ok) return renewed
    const result = await auth.enrolTotp(password.value)
    if (result.ok) {
      enrolment.value = result.data
      password.value = ''
    }
    return result
  })
}

async function confirmApp() {
  if (await attempt(() => auth.confirmTotp(code.value.replace(/\s+/g, '')))) confirmed.value = true
}

const { pending, guarded, cancel } = useReauthentication()

async function addPasskey() {
  // A new passkey, then signing in with it, which completes the second step.
  const registered = await attempt(() => guarded(() => auth.registerPasskey()))
  if (registered && await attempt(() => auth.signInWithPasskey())) await navigateTo(destination())
}
</script>

<template>
  <PageCard :title="status?.totp.enabled ? words.secondFactor.stepUpTitle : words.secondFactor.title">
    <div class="flex max-w-2xl flex-col gap-4">
      <AccountError :code="error" />

      <template v-if="status?.totp.enabled">
        <p>{{ words.secondFactor.stepUpIntro }}</p>
        <form class="flex max-w-md flex-col gap-3" @submit.prevent="stepUp">
          <AppField v-model="code" :label="words.fields.code" autocomplete="one-time-code" inputmode="numeric" required />
          <div>
            <AppButton :busy="busy">{{ words.signIn.continue }}</AppButton>
          </div>
        </form>
      </template>

      <template v-else-if="confirmed && enrolment">
        <AccountSection :title="words.secondFactor.backupCodesTitle">
          <p>{{ words.secondFactor.backupCodesIntro }}</p>
          <ul class="grid grid-cols-2 gap-2 font-mono sm:grid-cols-3">
            <li v-for="backup in enrolment.backupCodes" :key="backup">{{ backup }}</li>
          </ul>
          <div>
            <AppButton type="button" @click="navigateTo(destination())">{{ words.secondFactor.done }}</AppButton>
          </div>
        </AccountSection>
      </template>

      <template v-else>
        <p>{{ words.secondFactor.intro }}</p>
        <AccountSection :title="words.secondFactor.appTitle">
          <p>{{ words.secondFactor.appIntro }}</p>
          <form v-if="!enrolment" class="flex max-w-md flex-col gap-3" @submit.prevent="startApp">
            <AppField v-model="password" :label="words.fields.password" type="password" autocomplete="current-password" required />
            <div>
              <AppButton :busy="busy">{{ words.secondFactor.start }}</AppButton>
            </div>
          </form>
          <template v-else>
            <p>{{ words.secondFactor.scan }}</p>
            <QrCode :value="enrolment.totpUri" :label="words.secondFactor.appTitle" />
            <p>{{ words.secondFactor.key }}: <code class="break-all font-mono">{{ secret }}</code></p>
            <form class="flex max-w-md flex-col gap-3" @submit.prevent="confirmApp">
              <AppField v-model="code" :label="words.fields.code" autocomplete="one-time-code" inputmode="numeric" required />
              <div>
                <AppButton :busy="busy">{{ words.secondFactor.confirm }}</AppButton>
              </div>
            </form>
          </template>
        </AccountSection>
        <AccountSection :title="words.secondFactor.passkeyTitle">
          <p>{{ words.secondFactor.passkeyIntro }}</p>
          <ReauthenticateForm v-if="pending" @confirmed="cancel(); addPasskey()" @cancel="cancel" />
          <div v-else>
            <AppButton variant="plain" type="button" :busy="busy" @click="addPasskey">{{ words.secondFactor.addPasskey }}</AppButton>
          </div>
        </AccountSection>
      </template>
    </div>
  </PageCard>
</template>
