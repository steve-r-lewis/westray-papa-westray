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
  <section class="card coming-soon" aria-labelledby="page-heading">
    <h1 id="page-heading">{{ page!.title }}</h1>
    <p class="badge">{{ shell.labels.comingSoonTitle }}</p>
    <p>{{ shell.labels.comingSoonBody }}</p>
  </section>
</template>
