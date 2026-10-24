<script setup lang="ts">
// One part of an account page, as a card in the base role.
defineProps<{ title: string }>()
const id = useId()
</script>

<template>
  <section :aria-labelledby="id" class="flex flex-col gap-3 rounded-card border border-edge-base-default bg-fill-base-default p-4 text-pen-base-default sm:p-5">
    <h2 :id="id" class="text-xl font-bold">{{ title }}</h2>
    <slot />
  </section>
</template>
