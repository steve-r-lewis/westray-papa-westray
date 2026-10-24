<script setup lang="ts">
import type { AccountErrorCode } from '#shared/account'

// A refusal from Authentication, Identity or Profile, in the shell's words.
defineProps<{ code: AccountErrorCode | null }>()
const shell = useShell()
</script>

<template>
  <AppNotice v-if="code" tone="error">{{ shell.account.errors[code] }}</AppNotice>
</template>
