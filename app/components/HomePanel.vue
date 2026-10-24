<script setup lang="ts">
import type { z } from 'zod'
import type { homePanelSchema } from '#shared/shell'

// One dashboard panel. Until a section's content is built it shows the section's
// links and says the rest is coming; slice 1b fills News and What's on from Publisher.
defineProps<{ panel: z.infer<typeof homePanelSchema> }>()
const shell = useShell()
const id = useId()
</script>

<template>
  <section
    class="flex flex-col rounded-card border border-edge-secondary-default bg-fill-secondary-default p-5 text-pen-secondary-default shadow-sm"
    :class="{ 'lg:col-span-2': panel.wide }"
    :aria-labelledby="id"
  >
    <div class="mb-2 flex items-start justify-between gap-3">
      <h2 :id="id" class="flex items-center gap-2 text-xl font-bold leading-tight">
        <AppIcon :name="panel.icon" :size="22" />
        {{ panel.title }}
      </h2>
      <span class="shrink-0 rounded-pill border border-edge-info-default bg-fill-info-default px-2.5 py-0.5 text-xs font-semibold text-pen-info-default">
        {{ shell.labels.comingSoonTitle }}
      </span>
    </div>
    <p class="mb-4">{{ panel.description }}</p>

    <ul v-if="panel.links.length" class="mb-4 flex flex-wrap gap-2">
      <li v-for="link in panel.links" :key="link.to">
        <NuxtLink
          :to="link.to"
          class="flex items-center gap-2 rounded-control border border-edge-link-default bg-fill-link-default px-3 py-1.5 text-pen-link-default no-underline hover:border-edge-link-hover hover:bg-fill-link-hover hover:text-pen-link-hover"
        >
          <AppIcon v-if="link.icon" :name="link.icon" :size="18" />
          {{ link.label }}
        </NuxtLink>
      </li>
    </ul>

    <NuxtLink
      v-if="panel.to"
      :to="panel.to"
      class="mt-auto self-start rounded-control bg-fill-link-default font-medium text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover"
    >
      {{ shell.labels.seeAll }}<span class="sr-only">: {{ panel.title }}</span> →
    </NuxtLink>
  </section>
</template>
