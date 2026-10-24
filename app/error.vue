<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
// The shell may be what failed, so the page falls back to the status code alone.
const { data: shell } = await loadShell()
useSiteTheme()
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => shell.value
  ? (notFound.value ? shell.value.labels.notFoundTitle : shell.value.labels.errorTitle)
  : String(props.error.statusCode))

useHead({ title })
</script>

<template>
  <NuxtLayout v-if="shell">
    <PageCard :title="title">
      <p class="mb-4">{{ notFound ? shell.labels.notFoundBody : shell.labels.errorBody }}</p>
      <button
        type="button"
        class="rounded-control border border-edge-accent-default bg-fill-accent-default px-4 py-2 font-medium text-pen-accent-default hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover"
        @click="clearError({ redirect: '/' })"
      >
        {{ shell.labels.backHome }}
      </button>
    </PageCard>
  </NuxtLayout>
  <main v-else class="p-8 text-center">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
  </main>
</template>
