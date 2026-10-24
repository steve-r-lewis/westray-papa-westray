<script setup lang="ts">
import type { Section } from '#shared/shell'

// A section page: its introduction, then every published document of its types in
// its order, or what it says when there are none. Sections that offer feeds link to
// each type's RSS and Atom.
const props = defineProps<{ section: Section }>()
const shell = useShell()
const { data, error } = await useSectionListing(props.section.path)
if (error.value) throw createError({ statusCode: error.value.statusCode ?? 503, statusMessage: 'Content unavailable', fatal: true })

useHead({
  title: props.section.title,
  link: props.section.feeds
    ? props.section.types.flatMap(type => [
        { rel: 'alternate', type: 'application/rss+xml', title: `${shell.value.labels.typeNames[type]} (${shell.value.labels.rss})`, href: `/feeds/${type}/rss` },
        { rel: 'alternate', type: 'application/atom+xml', title: `${shell.value.labels.typeNames[type]} (${shell.value.labels.atom})`, href: `/feeds/${type}/atom` },
      ])
    : [],
})
</script>

<template>
  <PageCard :title="section.title">
    <p class="mb-6">{{ section.intro }}</p>
    <ContentCards v-if="data?.cards.length" :cards="data.cards" />
    <p v-else class="italic">{{ section.empty }}</p>
    <p v-if="section.feeds" class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span>{{ shell.labels.feeds }}:</span>
      <template v-for="type in section.types" :key="type">
        <a :href="`/feeds/${type}/rss`" class="bg-fill-link-default text-pen-link-default underline hover:bg-fill-link-hover hover:text-pen-link-hover">{{ shell.labels.rss }}<span v-if="section.types.length > 1"> ({{ shell.labels.typeNames[type] }})</span></a>
        <a :href="`/feeds/${type}/atom`" class="bg-fill-link-default text-pen-link-default underline hover:bg-fill-link-hover hover:text-pen-link-hover">{{ shell.labels.atom }}<span v-if="section.types.length > 1"> ({{ shell.labels.typeNames[type] }})</span></a>
      </template>
    </p>
  </PageCard>
</template>
