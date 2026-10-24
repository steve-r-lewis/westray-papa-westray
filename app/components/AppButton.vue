<script setup lang="ts">
// A button for the account pages: the accent role for the main action, the base role
// for the others, the error role for what cannot be undone. While busy it is disabled
// and says so.
const props = withDefaults(defineProps<{
  variant?: 'accent' | 'plain' | 'error'
  type?: 'button' | 'submit'
  busy?: boolean
}>(), { variant: 'accent', type: 'submit', busy: false })

const VARIANTS = {
  accent: 'border-edge-accent-default bg-fill-accent-default text-pen-accent-default hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover',
  plain: 'border-edge-base-default bg-fill-base-default text-pen-base-default hover:border-edge-base-hover hover:bg-fill-base-hover hover:text-pen-base-hover',
  error: 'border-edge-error-default bg-fill-error-default text-pen-error-default hover:border-edge-error-hover hover:bg-fill-error-hover hover:text-pen-error-hover',
} as const
const classes = computed(() => VARIANTS[props.variant])
</script>

<template>
  <button
    :type="type"
    :disabled="busy"
    :aria-busy="busy || undefined"
    class="inline-flex items-center justify-center gap-2 rounded-control border px-4 py-2 font-medium disabled:cursor-wait"
    :class="classes"
  >
    <slot />
  </button>
</template>
