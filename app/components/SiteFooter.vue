<script setup lang="ts">
const shell = useShell()
const site = useSite()
</script>

<template>
  <footer class="flex flex-col gap-4 bg-fill-base-default px-4 py-5 text-pen-base-default sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <p class="m-0">{{ shell.footer.copyright }}</p>
    <div class="flex flex-wrap items-center gap-4">
      <nav v-if="shell.footer.links.length" :aria-label="shell.labels.footerNavigation">
        <ul class="flex flex-wrap gap-3">
          <li v-for="link in shell.footer.links" :key="link.to">
            <NuxtLink :to="link.to" class="bg-fill-link-default text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </nav>
      <ul v-if="site.social.length" :aria-label="shell.labels.social" class="flex gap-2">
        <li v-for="link in site.social" :key="link.url">
          <NuxtLink
            :to="link.url"
            target="_blank"
            class="flex rounded-control bg-fill-link-default p-1 text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover"
          >
            <AppIcon :name="socialIcon(link.network)" :size="22" />
            <span class="sr-only">{{ shell.labels.networks[link.network] ?? link.network }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </footer>
</template>
