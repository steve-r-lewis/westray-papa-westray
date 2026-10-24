<script setup lang="ts">
import { themeDefinitionToRuntime } from '@nuxt4-layers/theme-manager/contracts'

// The palettes a visitor may choose: every theme Theme Manager lets them see, in the
// shell's order. Hidden when storage is unavailable and only the built-in default exists.
const shell = useShell()
const runtime = useThemeRuntime()
const management = useThemeManagement()

const { data: themes } = await useAsyncData('themes', () => management.listThemes().catch(() => []), { default: () => [] })

const ordered = computed(() => {
  const rank = (id: string) => {
    const index = shell.value.themes.order.indexOf(id)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  return [...themes.value].sort((a, b) => rank(a.id) - rank(b.id) || a.name.localeCompare(b.name))
})

async function choose(id: string) {
  try {
    runtime.activate(themeDefinitionToRuntime(await management.loadTheme(id)))
  }
  catch (error) {
    runtime.failToDefault(error)
  }
}
</script>

<template>
  <label v-if="ordered.length" class="flex items-center gap-2 text-sm">
    <AppIcon name="palette" />
    <span class="sr-only 2xl:not-sr-only">{{ shell.labels.theme }}</span>
    <select
      class="rounded-control border border-edge-input-default bg-fill-input-default px-2 py-1 text-pen-input-default hover:border-edge-input-hover hover:bg-fill-input-hover"
      :value="runtime.selectedThemeId.value ?? runtime.activeTheme.value?.id ?? ''"
      @change="choose(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="theme in ordered" :key="theme.id" :value="theme.id">{{ theme.name }}</option>
    </select>
  </label>
</template>
