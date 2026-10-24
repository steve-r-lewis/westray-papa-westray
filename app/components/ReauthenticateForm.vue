<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// Asks for the password again before a sensitive change, then lets the page retry it.
const emit = defineEmits<{ confirmed: [], cancel: [] }>()
const shell = useShell()
const words = computed(() => shell.value.account)
const { reauthenticate } = useAuthentication()
const password = ref('')
const busy = ref(false)
const error = ref<AccountErrorCode | null>(null)

async function submit() {
  busy.value = true
  error.value = null
  const result = await reauthenticate({ method: 'password', password: password.value })
  busy.value = false
  if (!result.ok) {
    error.value = result.code
    return
  }
  password.value = ''
  emit('confirmed')
}
</script>

<template>
  <AccountSection :title="words.reauthenticate.title">
    <p>{{ words.reauthenticate.intro }}</p>
    <form class="flex flex-col gap-3" @submit.prevent="submit">
      <AccountError :code="error" />
      <AppField v-model="password" :label="words.fields.password" type="password" autocomplete="current-password" required />
      <div class="flex flex-wrap gap-2">
        <AppButton :busy="busy">{{ words.reauthenticate.submit }}</AppButton>
        <AppButton variant="plain" type="button" @click="emit('cancel')">{{ words.reauthenticate.cancel }}</AppButton>
      </div>
    </form>
  </AccountSection>
</template>
