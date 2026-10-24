<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section
    class="mx-auto max-w-5xl rounded-card border border-edge-secondary-default bg-fill-secondary-default p-5 text-pen-secondary-default shadow-sm sm:p-6"
    aria-labelledby="page-heading"
  >
    <h1 id="page-heading" class="mb-3 text-3xl font-bold leading-tight">{{ title }}</h1>
    <slot />
  </section>
</template>
