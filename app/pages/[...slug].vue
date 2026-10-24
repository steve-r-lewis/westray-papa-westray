<script setup lang="ts">
const shell = useShell()
const route = useRoute()

// Pages not built yet are listed in the shell data; anything else is not found.
const path = route.path.length > 1 ? route.path.replace(/\/+$/, '') : route.path
const page = shell.value.comingSoon.find(entry => entry.path === path)
if (!page) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({ title: page.title })
</script>

<template>
  <PageCard :title="page!.title">
    <p class="mb-3">
      <span class="inline-block rounded-pill border border-edge-info-default bg-fill-info-default px-3 py-0.5 text-sm font-semibold text-pen-info-default">
        {{ shell.labels.comingSoonTitle }}
      </span>
    </p>
    <p>{{ shell.labels.comingSoonBody }}</p>
  </PageCard>
</template>
