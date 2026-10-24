<script setup lang="ts">
const shell = useShell()
</script>

<template>
  <footer class="flex flex-col gap-6 bg-fill-base-default px-4 py-6 text-pen-base-default sm:px-6">
    <nav :aria-label="shell.labels.siteMap">
      <h2 class="sr-only">{{ shell.labels.siteMap }}</h2>
      <div class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        <section v-for="group in shell.navigation.groups" :key="group.label">
          <h3 class="mb-2 text-sm font-semibold uppercase tracking-wider">{{ group.label }}</h3>
          <ul class="flex flex-col gap-1">
            <li v-for="item in group.items" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="-mx-1 inline-flex items-center gap-2 rounded-control bg-fill-link-default px-1 text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover aria-[current=page]:font-semibold"
              >
                <AppIcon v-if="item.icon" :name="item.icon" :size="16" />
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </nav>

    <div class="flex flex-col gap-4 border-t border-edge-base-default pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="m-0">{{ shell.footer.copyright }}</p>
      <div class="flex flex-wrap items-center gap-4">
        <nav v-if="shell.footer.links.length" :aria-label="shell.labels.footerNavigation">
          <ul class="flex flex-wrap gap-3">
            <li v-for="link in shell.footer.links" :key="link.to">
              <NuxtLink :to="link.to" class="bg-fill-link-default text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover">{{ link.label }}</NuxtLink>
            </li>
          </ul>
        </nav>
        <ul v-if="shell.footer.social.length" :aria-label="shell.labels.social" class="flex gap-2">
          <li v-for="link in shell.footer.social" :key="link.to">
            <NuxtLink
              :to="link.to"
              target="_blank"
              class="flex rounded-control bg-fill-link-default p-1 text-pen-link-default hover:bg-fill-link-hover hover:text-pen-link-hover"
            >
              <AppIcon :name="link.icon" :size="22" />
              <span class="sr-only">{{ link.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
