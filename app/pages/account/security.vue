<script setup lang="ts">
import type { AuthenticationResult } from '@nuxt4-layers/authentication/contracts'
import type { AccountErrorCode } from '#shared/account'

// How the member signs in, from Authentication: their password, authenticator app and
// backup codes, passkeys, and where they are signed in. Changes that need a recent
// sign-in ask for the password first, then run again.
definePageMeta({ middleware: 'authenticated' })

const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const policy = useAuthenticationPublicPolicy()
const site = useSite()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.security.title })

const { data: status, refresh: refreshStatus } = await useAsyncData('account:mfa', async () => {
  const result = await auth.mfaStatus()
  return result.ok ? result.data : null
})
const { data: sessions, refresh: refreshSessions } = await useAsyncData('account:sessions', async () => {
  const result = await auth.listSessions()
  return result.ok ? result.data : []
})

const { pending, guarded, confirmed, cancel } = useReauthentication()
const busy = ref(false)
const error = ref<AccountErrorCode | null>(null)
const notice = ref<string | null>(null)
const currentPassword = ref('')
const newPassword = ref('')
const passkeyName = ref('')
const codesPassword = ref('')
const backupCodes = ref<string[] | null>(null)

async function attempt<T>(action: () => Promise<AuthenticationResult<T>>): Promise<AuthenticationResult<T>> {
  busy.value = true
  error.value = null
  notice.value = null
  const result = await guarded(action)
  busy.value = false
  if (!result.ok && result.code !== 'reauthentication-required') error.value = result.code
  return result
}

async function changePassword() {
  const result = await attempt(() => auth.changePassword(currentPassword.value, newPassword.value))
  if (!result.ok) return
  currentPassword.value = ''
  newPassword.value = ''
  notice.value = words.value.security.passwordChanged
  await refreshSessions()
}

async function newBackupCodes() {
  const result = await attempt(() => auth.regenerateBackupCodes(codesPassword.value))
  if (result.ok) {
    codesPassword.value = ''
    backupCodes.value = result.data.backupCodes
    await refreshStatus()
  }
}

async function addPasskey() {
  const result = await attempt(() => auth.registerPasskey(passkeyName.value.trim() || undefined))
  if (result.ok) {
    passkeyName.value = ''
    await refreshStatus()
  }
}

async function removePasskey(id: string) {
  if ((await attempt(() => auth.removePasskey(id))).ok) await refreshStatus()
}

async function signOutSession(sessionId: string) {
  if ((await attempt(() => auth.revokeSession(sessionId))).ok) await refreshSessions()
}

async function signOutOthers() {
  if ((await attempt(() => auth.revokeOtherSessions())).ok) await refreshSessions()
}

async function reauthenticated() {
  await confirmed()
  await Promise.all([refreshStatus(), refreshSessions()])
}

const when = (instant: string | null | undefined) => (instant ? formatDateTime(instant, site.value.locale) : '')
</script>

<template>
  <PageCard :title="words.security.title">
    <div class="flex flex-col gap-4">
      <p>{{ words.security.intro }}</p>
      <AccountError :code="error" />
      <AppNotice v-if="notice" tone="success">{{ notice }}</AppNotice>
      <ReauthenticateForm v-if="pending" @confirmed="reauthenticated" @cancel="cancel" />

      <AccountSection :title="words.security.passwordTitle">
        <form class="flex max-w-md flex-col gap-3" @submit.prevent="changePassword">
          <AppField v-model="currentPassword" :label="words.fields.currentPassword" type="password" autocomplete="current-password" required />
          <AppField
            v-model="newPassword"
            :label="words.fields.newPassword"
            type="password"
            autocomplete="new-password"
            :hint="fill(words.passwordHint, { min: policy?.password.minLength ?? 15 })"
            :minlength="policy?.password.minLength"
            :maxlength="policy?.password.maxLength"
            required
          />
          <div>
            <AppButton :busy="busy">{{ words.security.changePassword }}</AppButton>
          </div>
        </form>
      </AccountSection>

      <AccountSection :title="words.security.appTitle">
        <p class="font-semibold">{{ status?.totp.enabled ? words.security.appOn : words.security.appOff }}</p>
        <p v-if="!status?.totp.enabled"><AppLink :to="routes.mfa">{{ words.security.setUpApp }}</AppLink></p>
        <template v-else>
          <h3 class="font-semibold">{{ words.security.backupCodesTitle }}</h3>
          <p>{{ fill(words.security.backupCodesLeft, { count: status.backupCodes.remaining }) }}</p>
          <template v-if="backupCodes">
            <p>{{ words.secondFactor.backupCodesIntro }}</p>
            <ul class="grid grid-cols-2 gap-2 font-mono sm:grid-cols-3">
              <li v-for="code in backupCodes" :key="code">{{ code }}</li>
            </ul>
          </template>
          <form class="flex max-w-md flex-col gap-3" @submit.prevent="newBackupCodes">
            <AppField v-model="codesPassword" :label="words.fields.password" type="password" autocomplete="current-password" required />
            <div>
              <AppButton variant="plain" :busy="busy">{{ words.security.newBackupCodes }}</AppButton>
            </div>
          </form>
        </template>
      </AccountSection>

      <AccountSection :title="words.security.passkeysTitle">
        <ul v-if="status?.passkeys.length" class="flex flex-col gap-2">
          <li v-for="passkey in status.passkeys" :key="passkey.id" class="flex flex-wrap items-center justify-between gap-2 rounded-control border border-edge-base-default p-3">
            <span>
              <strong>{{ passkey.name || words.security.passkeysTitle }}</strong>
              <span v-if="passkey.createdAt" class="block text-sm">{{ words.security.added }} {{ when(passkey.createdAt) }}</span>
            </span>
            <AppButton variant="plain" type="button" :busy="busy" @click="removePasskey(passkey.id)">{{ words.security.remove }}</AppButton>
          </li>
        </ul>
        <p v-else>{{ words.security.noPasskeys }}</p>
        <form class="flex max-w-md flex-col gap-3" @submit.prevent="addPasskey">
          <AppField v-model="passkeyName" :label="words.fields.passkeyName" :maxlength="64" />
          <div>
            <AppButton variant="plain" :busy="busy">{{ words.security.addPasskey }}</AppButton>
          </div>
        </form>
      </AccountSection>

      <AccountSection :title="words.security.sessionsTitle">
        <ul class="flex flex-col gap-2">
          <li v-for="session in sessions ?? []" :key="session.sessionId" class="flex flex-wrap items-center justify-between gap-2 rounded-control border border-edge-base-default p-3">
            <span>
              <strong>{{ session.clientDescription || words.security.unknownDevice }}</strong>
              <span v-if="session.current" class="ml-2 rounded-pill border border-edge-info-default bg-fill-info-default px-2 text-sm text-pen-info-default">{{ words.security.thisDevice }}</span>
              <span class="block text-sm">{{ words.security.signedInAt }} {{ when(session.createdAt) }}</span>
            </span>
            <AppButton v-if="!session.current" variant="plain" type="button" :busy="busy" @click="signOutSession(session.sessionId)">{{ words.security.signOutSession }}</AppButton>
          </li>
        </ul>
        <div>
          <AppButton variant="plain" type="button" :busy="busy" @click="signOutOthers">{{ words.security.signOutOthers }}</AppButton>
        </div>
      </AccountSection>
    </div>
  </PageCard>
</template>
