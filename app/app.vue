<script setup lang="ts">
const { data: shell, error } = await loadShell()
if (error.value || !shell.value) {
  throw createError({ statusCode: 503, statusMessage: 'Shell unavailable', fatal: true })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
