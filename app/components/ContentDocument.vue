<script setup lang="ts">
import type { ContentPage } from '#shared/content'

// One published document from Publisher, drawn by its type: pages are their text;
// articles and blog posts add when they were published; events and workshops when
// and where; Creative Trail stops their number, place and maker.
const props = defineProps<{ page: ContentPage }>()
const shell = useShell()
const site = useSite()

const text = (name: string) => (typeof props.page.fields[name] === 'string' ? props.page.fields[name] as string : '')
const facts = computed(() => {
  const { page } = props
  const locale = site.value.locale
  const rows: { label: string, value: string, datetime?: string }[] = []
  if (page.type === 'article' || page.type === 'blog-post') {
    if (page.publishedAt) rows.push({ label: shell.value.labels.published, value: formatDate(page.publishedAt, locale), datetime: page.publishedAt })
  }
  if (page.type === 'event' || page.type === 'workshop') {
    rows.push({ label: shell.value.labels.when, value: formatSpan(text('startsAt'), text('endsAt') || undefined, locale), datetime: text('startsAt') })
    rows.push({ label: shell.value.labels.where, value: text('venue') })
    if (text('organiser')) rows.push({ label: shell.value.labels.organiser, value: text('organiser') })
  }
  if (page.type === 'creative-trail-stop') {
    rows.push({ label: shell.value.labels.stop, value: String(page.fields.stop) })
    rows.push({ label: shell.value.labels.where, value: text('location') })
    if (text('maker')) rows.push({ label: shell.value.labels.maker, value: text('maker') })
  }
  return rows.filter(row => row.value)
})
</script>

<template>
  <PageCard :title="page.title">
    <dl v-if="facts.length" class="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      <template v-for="fact in facts" :key="fact.label">
        <dt class="font-semibold">{{ fact.label }}</dt>
        <dd>
          <time v-if="fact.datetime" :datetime="fact.datetime">{{ fact.value }}</time>
          <template v-else>{{ fact.value }}</template>
        </dd>
      </template>
    </dl>
    <p v-if="page.summary && page.type !== 'page'" class="mb-4 text-lg">{{ page.summary }}</p>
    <RichText v-for="field in page.richText" :key="field.path" :nodes="field.nodes" :links="page.links" />
  </PageCard>
</template>
