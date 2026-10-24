<script setup lang="ts">
const shell = useShell()
const route = useRoute()

// Every address but the home and Contact pages: a section listing (data/shell.json),
// a page not built yet, or whatever Publisher has published there. Anything else,
// including a document a reader may not see, is not found.
const path = route.path.length > 1 ? route.path.replace(/\/+$/, '') : route.path
const section = shell.value.sections.find(entry => entry.path === path)
const comingSoon = section ? undefined : shell.value.comingSoon.find(entry => entry.path === path)

const content = section || comingSoon ? null : await useContentPage(path)
const resolved = content?.data.value ?? null
if (content?.error.value) {
  const status = content.error.value.statusCode
  throw createError(status === 404
    ? { statusCode: 404, statusMessage: 'Page not found' }
    : { statusCode: 503, statusMessage: 'Content unavailable', fatal: true })
}
if (resolved?.kind === 'redirect') await navigateTo(resolved.to, { redirectCode: 301 })
const page = resolved?.kind === 'document' ? resolved.page : null

if (comingSoon) useHead({ title: comingSoon.title })
if (page) {
  useHead({
    title: page.title,
    meta: page.summary ? [{ name: 'description', content: page.summary }] : [],
  })
}
</script>

<template>
  <ContentSection v-if="section" :section="section" />
  <ContentDocument v-else-if="page" :page="page" />
  <PageCard v-else-if="comingSoon" :title="comingSoon.title">
    <p class="mb-3">
      <span class="inline-block rounded-pill border border-edge-info-default bg-fill-info-default px-3 py-0.5 text-sm font-semibold text-pen-info-default">
        {{ shell.labels.comingSoonTitle }}
      </span>
    </p>
    <p>{{ shell.labels.comingSoonBody }}</p>
  </PageCard>
</template>
