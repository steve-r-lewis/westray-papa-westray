<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// Creating an account: an email address and a password. Authentication answers the
// same whether or not the address already has an account, and sends a link to
// confirm it; the account is Identity's once confirmed.
definePageMeta({ middleware: 'guest' })

const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const policy = useAuthenticationPublicPolicy()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.signUp.title })

const email = ref('')
const password = ref('')
const busy = ref(false)
const sent = ref(false)
const error = ref<AccountErrorCode | null>(null)

async function signUp() {
  busy.value = true
  error.value = null
  const result = await auth.signUp(email.value, password.value)
  busy.value = false
  if (!result.ok) {
    error.value = result.code
    return
  }
  password.value = ''
  sent.value = true
}
</script>

<template>
  <PageCard :title="words.signUp.title">
    <div class="flex max-w-md flex-col gap-4">
      <AppNotice v-if="sent" tone="success">{{ words.signUp.sent }}</AppNotice>
      <template v-else>
        <p>{{ words.signUp.intro }}</p>
        <AccountError :code="error" />
        <form class="flex flex-col gap-3" @submit.prevent="signUp">
          <AppField v-model="email" :label="words.fields.email" type="email" autocomplete="email" required />
          <AppField
            v-model="password"
            :label="words.fields.password"
            type="password"
            autocomplete="new-password"
            :hint="fill(words.passwordHint, { min: policy?.password.minLength ?? 15 })"
            :minlength="policy?.password.minLength"
            :maxlength="policy?.password.maxLength"
            required
          />
          <div>
            <AppButton :busy="busy">{{ words.signUp.submit }}</AppButton>
          </div>
        </form>
      </template>
      <p>
        {{ words.signUp.haveAccount }}
        <AppLink :to="routes.signIn">{{ words.signUp.signIn }}</AppLink>
      </p>
    </div>
  </PageCard>
</template>
