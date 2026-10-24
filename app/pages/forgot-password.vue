<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// Asking for a link to choose a new password. The answer is the same whether or not
// an account uses the address.
const shell = useShell()
const words = computed(() => shell.value.account)
const auth = useAuthentication()
const routes = useRuntimeConfig().public.authentication.routes
useHead({ title: () => words.value.forgotPassword.title })

const email = ref('')
const busy = ref(false)
const sent = ref(false)
const error = ref<AccountErrorCode | null>(null)

async function send() {
  busy.value = true
  error.value = null
  const result = await auth.requestPasswordReset(email.value)
  busy.value = false
  if (result.ok) sent.value = true
  else error.value = result.code
}
</script>

<template>
  <PageCard :title="words.forgotPassword.title">
    <div class="flex max-w-md flex-col gap-4">
      <AppNotice v-if="sent" tone="success">{{ words.forgotPassword.sent }}</AppNotice>
      <template v-else>
        <p>{{ words.forgotPassword.intro }}</p>
        <AccountError :code="error" />
        <form class="flex flex-col gap-3" @submit.prevent="send">
          <AppField v-model="email" :label="words.fields.email" type="email" autocomplete="email" required />
          <div>
            <AppButton :busy="busy">{{ words.forgotPassword.submit }}</AppButton>
          </div>
        </form>
      </template>
      <p><AppLink :to="routes.signIn">{{ words.forgotPassword.backToSignIn }}</AppLink></p>
    </div>
  </PageCard>
</template>
