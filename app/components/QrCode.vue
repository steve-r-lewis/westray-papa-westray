<script setup lang="ts">
import { encode } from 'uqr'

// A QR code drawn as one SVG path in the input role's colours (dark on light in a light
// mode), for an authenticator app to scan. The same value is always offered as text.
const props = defineProps<{ value: string, label: string }>()
const code = computed(() => {
  const { data, size } = encode(props.value, { border: 2 })
  let path = ''
  data.forEach((row, y) => row.forEach((dark, x) => {
    if (dark) path += `M${x} ${y}h1v1h-1z`
  }))
  return { path, size }
})
</script>

<template>
  <svg
    role="img"
    :aria-label="label"
    :viewBox="`0 0 ${code.size} ${code.size}`"
    shape-rendering="crispEdges"
    class="size-48 rounded-control border border-edge-input-default bg-fill-input-default text-pen-input-default"
  >
    <path :d="code.path" fill="currentColor" />
  </svg>
</template>
