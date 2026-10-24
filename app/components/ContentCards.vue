<script setup lang="ts">
import type { ContentCard } from '#shared/content'

// A list of Publisher's documents as cards: each its title, linked, a line saying
// when (or which stop), and its summary.
defineProps<{ cards: ContentCard[], compact?: boolean }>()
const shell = useShell()
const site = useSite()

function line(card: ContentCard): { text: string, datetime?: string } | null {
  const locale = site.value.locale
  if (card.startsAt) return { text: [formatSpan(card.startsAt, card.endsAt, locale), card.venue].filter(Boolean).join(' · '), datetime: card.startsAt }
  if (card.stop !== undefined) return { text: [`${shell.value.labels.stop} ${card.stop}`, card.location].filter(Boolean).join(' · ') }
  if (card.publishedAt) return { text: formatDate(card.publishedAt, locale), datetime: card.publishedAt }
  return null
}
</script>

<template>
  <ul class="flex flex-col" :class="compact ? 'gap-3' : 'gap-4'">
    <li v-for="card in cards" :key="card.id" :class="compact ? '' : 'border-b border-edge-muted-default pb-4 last:border-b-0 last:pb-0'">
      <h3 class="font-bold leading-tight" :class="compact ? 'text-base' : 'text-xl'">
        <NuxtLink :to="card.path" class="bg-fill-link-default text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover">{{ card.title }}</NuxtLink>
      </h3>
      <p v-if="line(card)" class="text-sm">
        <time v-if="line(card)!.datetime" :datetime="line(card)!.datetime">{{ line(card)!.text }}</time>
        <template v-else>{{ line(card)!.text }}</template>
      </p>
      <p v-if="card.summary && !compact" class="mt-1">{{ card.summary }}</p>
    </li>
  </ul>
</template>
