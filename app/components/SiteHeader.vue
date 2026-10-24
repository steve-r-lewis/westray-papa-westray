<script setup lang="ts">
defineProps<{ menuOpen: boolean }>()
const emit = defineEmits<{ openMenu: [] }>()
const shell = useShell()
const member = useMember()
</script>

<template>
  <header class="flex flex-wrap items-center gap-x-4 gap-y-3 bg-fill-base-default px-4 py-3 text-pen-base-default shadow-sm sm:px-6 xl:flex-nowrap">
    <!-- The side menu is for signed-in members only. -->
    <button
      v-if="member"
      type="button"
      class="rounded-control p-1 hover:bg-fill-base-hover hover:text-pen-base-hover"
      aria-controls="site-menu"
      :aria-expanded="menuOpen"
      @click="emit('openMenu')"
    >
      <AppIcon name="menu" :size="28" />
      <span class="sr-only">{{ shell.labels.openMenu }}</span>
    </button>

    <NuxtLink to="/" class="order-1 mr-auto flex min-w-0 flex-1 items-center gap-3 no-underline xl:flex-none">
      <img :src="shell.site.logo.src" :alt="shell.site.logo.alt" width="44" height="44" class="size-9 shrink-0 sm:size-11">
      <span class="flex min-w-0 flex-col">
        <span class="text-xl font-bold leading-tight sm:text-2xl">{{ shell.site.name }}</span>
        <span class="text-sm xl:whitespace-nowrap">{{ shell.site.tagline }}</span>
      </span>
    </NuxtLink>

    <nav
      :aria-label="shell.labels.primaryNavigation"
      class="order-4 w-full xl:order-2 xl:w-auto"
    >
      <ul class="-mx-2 flex flex-wrap gap-1 xl:mx-0 xl:flex-nowrap">
        <li v-for="link in shell.header.links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="block whitespace-nowrap rounded-control bg-fill-link-default px-2 py-1 text-pen-link-default no-underline hover:bg-fill-link-hover hover:text-pen-link-hover hover:underline aria-[current=page]:bg-fill-link-selected aria-[current=page]:text-pen-link-selected aria-[current=page]:font-semibold"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="order-3 flex w-full flex-wrap items-center gap-2 md:order-2 md:w-auto xl:order-3">
      <ThemePicker />
      <ColourModeSwitch />
    </div>

    <NuxtLink
      v-if="!member"
      :to="shell.header.signIn.to"
      class="order-2 flex items-center gap-2 whitespace-nowrap rounded-control md:order-3 xl:order-4 border border-edge-accent-default bg-fill-accent-default px-3 py-1.5 font-medium text-pen-accent-default no-underline hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover"
    >
      <AppIcon v-if="shell.header.signIn.icon" :name="shell.header.signIn.icon" :size="18" />
      {{ shell.header.signIn.label }}
    </NuxtLink>
  </header>
</template>
