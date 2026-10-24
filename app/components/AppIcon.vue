<script setup lang="ts">
import { icons, type IconName, type IconShape } from '#shared/icons'

const props = defineProps<{ name: IconName, size?: number }>()
const shape = computed<IconShape>(() => icons[props.name])
</script>

<template>
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    :width="size ?? 20"
    :height="size ?? 20"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <path v-for="path in shape.paths" :key="path" :d="path" />
    <circle v-for="[cx, cy, r] in shape.circles ?? []" :key="`${cx},${cy}`" :cx="cx" :cy="cy" :r="r" />
  </svg>
</template>
