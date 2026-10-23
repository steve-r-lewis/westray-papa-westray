<script setup lang="ts">
defineProps<{ menuOpen: boolean }>()
const emit = defineEmits<{ openMenu: [] }>()
const shell = useShell()
</script>

<template>
  <header class="site-header">
    <button
      type="button"
      class="menu-button"
      aria-controls="site-menu"
      :aria-expanded="menuOpen"
      @click="emit('openMenu')"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      <span class="visually-hidden">{{ shell.labels.openMenu }}</span>
    </button>

    <NuxtLink to="/" class="brand">
      <span class="brand-name">{{ shell.site.name }}</span>
      <span class="brand-tagline">{{ shell.site.tagline }}</span>
    </NuxtLink>

    <nav class="header-nav" :aria-label="shell.labels.primaryNavigation">
      <ul>
        <li v-for="link in shell.header.links" :key="link.to">
          <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
        </li>
      </ul>
    </nav>

    <NuxtLink :to="shell.header.signIn.to" class="button button-primary sign-in">
      {{ shell.header.signIn.label }}
    </NuxtLink>
  </header>
</template>
