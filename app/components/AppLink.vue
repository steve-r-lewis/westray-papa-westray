<script setup lang="ts">
// A link in running text, in the theme's link role.
defineProps<{ to: string }>()
</script>

<template>
  <NuxtLink :to="to" class="bg-fill-link-default text-pen-link-default underline hover:bg-fill-link-hover hover:text-pen-link-hover">
    <slot />
  </NuxtLink>
</template>
