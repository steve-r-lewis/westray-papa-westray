<script setup lang="ts">
// One header button for the look of the site: it opens a small panel holding the
// palette picker and the colour mode switch. Closes on Escape, outside clicks and
// navigation. The panel stays mounted and is hidden with a class: Theme Manager's
// utilities are !important, so v-show's inline display:none would lose to `flex`.
const shell = useShell()
const route = useRoute()
const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const panelId = useId()

function onDocumentClick(event: MouseEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    root.value?.querySelector('button')?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-2 rounded-control border border-edge-input-default bg-fill-input-default px-3 py-1.5 text-pen-input-default hover:border-edge-input-hover hover:bg-fill-input-hover hover:text-pen-input-hover aria-expanded:bg-fill-input-selected aria-expanded:text-pen-input-selected"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <AppIcon name="palette" />
      <span class="sr-only sm:not-sr-only">{{ shell.labels.appearance }}</span>
      <AppIcon name="chevron-down" :size="16" class="transition-transform" :class="{ 'rotate-180': open }" />
    </button>
    <div
      :id="panelId"
      :class="open ? 'flex' : 'hidden'"
      class="fixed inset-x-4 top-20 z-40 flex-col gap-4 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 rounded-panel border border-edge-base-default bg-fill-base-default p-4 text-pen-base-default shadow-lg"
    >
      <ThemePicker />
      <div class="flex flex-col gap-2">
        <span class="text-sm font-semibold">{{ shell.labels.colourMode }}</span>
        <ColourModeSwitch />
      </div>
    </div>
  </div>
</template>
