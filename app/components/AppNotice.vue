<script setup lang="ts">
// A message on the account pages, in its own role so its text keeps its contrast:
// an error is announced at once, anything else when the reader is ready.
const props = withDefaults(defineProps<{ tone?: 'info' | 'success' | 'error' }>(), { tone: 'info' })

const TONES = {
  info: 'border-edge-info-default bg-fill-info-default text-pen-info-default',
  success: 'border-edge-success-default bg-fill-success-default text-pen-success-default',
  error: 'border-edge-error-default bg-fill-error-default text-pen-error-default',
} as const
const classes = computed(() => TONES[props.tone])
</script>

<template>
  <div :role="tone === 'error' ? 'alert' : 'status'" class="rounded-control border px-4 py-3" :class="classes">
    <slot />
  </div>
</template>
