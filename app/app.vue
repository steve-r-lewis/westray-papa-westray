<script setup lang="ts">
const [{ data: shell, error }, { data: site, error: siteError }] = await Promise.all([loadShell(), loadSite()])
if (error.value || !shell.value || siteError.value || !site.value) {
  throw createError({ statusCode: 503, statusMessage: 'Shell unavailable', fatal: true })
}
useSiteTheme()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
