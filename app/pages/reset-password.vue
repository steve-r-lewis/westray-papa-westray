<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// Choosing a new password from the emailed link (`?token=`). Success signs the person
// out everywhere and sends them to sign in.
const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const policy = useAuthenticationPublicPolicy()
const route = useRoute()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.resetPassword.title })

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const password = ref('')
const busy = ref(false)
const error = ref<AccountErrorCode | null>(null)

async function reset() {
  busy.value = true
  error.value = null
  const result = await auth.resetPassword(token.value, password.value)
  busy.value = false
  if (!result.ok) {
    error.value = result.code
    return
  }
  await navigateTo({ path: routes.signIn, query: { reset: 'done' } })
}
</script>

<template>
  <PageCard :title="words.resetPassword.title">
    <div class="flex max-w-md flex-col gap-4">
      <template v-if="token">
        <p>{{ words.resetPassword.intro }}</p>
        <AccountError :code="error" />
        <form class="flex flex-col gap-3" @submit.prevent="reset">
          <AppField
            v-model="password"
            :label="words.fields.newPassword"
            type="password"
            autocomplete="new-password"
            :hint="fill(words.passwordHint, { min: policy?.password.minLength ?? 15 })"
            :minlength="policy?.password.minLength"
            :maxlength="policy?.password.maxLength"
            required
          />
          <div>
            <AppButton :busy="busy">{{ words.resetPassword.submit }}</AppButton>
          </div>
        </form>
      </template>
      <AppNotice v-else tone="error">{{ words.resetPassword.missingToken }}</AppNotice>
      <p><AppLink :to="routes.forgotPassword">{{ words.signIn.forgotPassword }}</AppLink></p>
    </div>
  </PageCard>
</template>
