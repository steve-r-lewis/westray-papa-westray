<script setup lang="ts">
const shell = useShell()
const site = useSite()
const member = useMember()
const menuOpen = ref(false)

// Here rather than in app.vue so the error page, which replaces app.vue, gets it too.
useHead({
  htmlAttrs: { lang: () => site.value.locale },
  bodyAttrs: { class: 'bg-fill-floor-default text-pen-floor-default' },
  // Configuration's seo.title-template places the page title; the home page is just the name.
  titleTemplate: title => title && site.value.titleTemplate ? site.value.titleTemplate.replace('%s', title) : site.value.name,
  meta: [{ name: 'description', content: () => site.value.description }],
})
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 sm:px-6 sm:py-6 lg:gap-8 lg:px-10 lg:py-10">
    <a
      class="absolute left-2 top-2 z-50 -translate-y-[200%] rounded-control border border-edge-accent-default bg-fill-accent-default px-4 py-2 text-pen-accent-default focus:translate-y-0"
      href="#main"
    >{{ shell.labels.skipToContent }}</a>
    <SiteMenu v-if="member" v-model:open="menuOpen" />
    <SiteHeader :menu-open="menuOpen" @open-menu="menuOpen = true" />
    <main id="main" tabindex="-1" class="flex-1 px-4 outline-none sm:px-0">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
