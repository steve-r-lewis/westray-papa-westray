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

    <NuxtLink to="/" class="mr-auto flex min-w-0 flex-1 items-center gap-3 no-underline xl:flex-none">
      <img :src="shell.site.logo.src" :alt="shell.site.logo.alt" width="44" height="44" class="size-9 shrink-0 sm:size-11">
      <span class="flex min-w-0 flex-col">
        <span class="text-xl font-bold leading-tight sm:text-2xl">{{ shell.site.name }}</span>
        <span class="hidden text-sm sm:block xl:whitespace-nowrap">{{ shell.site.tagline }}</span>
      </span>
    </NuxtLink>

    <!-- One row on wide screens; below that the links take a row of their own. -->
    <nav :aria-label="shell.labels.primaryNavigation" class="order-last w-full xl:order-none xl:mx-auto xl:w-auto">
      <ul class="-mx-2 flex flex-wrap gap-1 xl:mx-0 xl:flex-nowrap">
        <li v-for="link in shell.header.links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="flex items-center gap-1.5 whitespace-nowrap rounded-control bg-fill-link-default px-2.5 py-1.5 text-pen-link-default no-underline hover:bg-fill-link-hover hover:text-pen-link-hover aria-[current=page]:bg-fill-link-selected aria-[current=page]:text-pen-link-selected aria-[current=page]:font-semibold"
          >
            <AppIcon v-if="link.icon" :name="link.icon" :size="18" class="hidden sm:block xl:hidden" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="flex items-center gap-2">
      <AppearanceMenu />
      <NuxtLink
        v-if="!member"
        :to="shell.header.signIn.to"
        class="flex items-center gap-2 whitespace-nowrap rounded-control border border-edge-accent-default bg-fill-accent-default px-3 py-1.5 font-medium text-pen-accent-default no-underline hover:border-edge-accent-hover hover:bg-fill-accent-hover hover:text-pen-accent-hover"
      >
        <AppIcon v-if="shell.header.signIn.icon" :name="shell.header.signIn.icon" :size="18" />
        {{ shell.header.signIn.label }}
      </NuxtLink>
    </div>
  </header>
</template>
