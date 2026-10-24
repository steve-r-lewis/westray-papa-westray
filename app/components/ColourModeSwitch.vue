<script setup lang="ts">
import type { IconName } from '#shared/icons'

const shell = useShell()
const { preference } = useColourMode()

const options = computed(() => [
  { mode: 'system', label: shell.value.labels.modeSystem, icon: 'monitor' },
  { mode: 'light', label: shell.value.labels.modeLight, icon: 'sun' },
  { mode: 'dark', label: shell.value.labels.modeDark, icon: 'moon' },
] as Array<{ mode: ColourMode, label: string, icon: IconName }>)
</script>

<template>
  <div
    role="group"
    :aria-label="shell.labels.colourMode"
    class="flex rounded-control border border-edge-input-default bg-fill-input-default p-0.5"
  >
    <button
      v-for="option in options"
      :key="option.mode"
      type="button"
      :aria-pressed="preference === option.mode"
      :title="option.label"
      class="flex items-center gap-1 rounded-control px-2 py-1 text-sm text-pen-input-default hover:bg-fill-input-hover hover:text-pen-input-hover aria-pressed:bg-fill-input-selected aria-pressed:text-pen-input-selected aria-pressed:font-semibold"
      @click="preference = option.mode"
    >
      <AppIcon :name="option.icon" :size="18" />
      <span class="sr-only 2xl:not-sr-only">{{ option.label }}</span>
    </button>
  </div>
</template>
