<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
// The shell may be what failed, so the page falls back to the status code alone.
const { data: shell } = await loadShell()
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => shell.value
  ? (notFound.value ? shell.value.labels.notFoundTitle : shell.value.labels.errorTitle)
  : String(props.error.statusCode))

useHead({ title })
</script>

<template>
  <NuxtLayout v-if="shell">
    <section class="card" aria-labelledby="error-heading">
      <h1 id="error-heading">{{ title }}</h1>
      <p>{{ notFound ? shell.labels.notFoundBody : shell.labels.errorBody }}</p>
      <button type="button" class="button button-primary" @click="clearError({ redirect: '/' })">
        {{ shell.labels.backHome }}
      </button>
    </section>
  </NuxtLayout>
  <main v-else class="bare-error">
    <h1>{{ title }}</h1>
  </main>
</template>
