<script setup lang="ts">
const shell = useShell()
const menuOpen = ref(false)

// Here rather than in app.vue so the error page, which replaces app.vue, gets it too.
useHead({
  htmlAttrs: { lang: () => shell.value.site.locale },
  titleTemplate: title => title ? `${title} | ${shell.value.site.name}` : shell.value.site.name,
})
</script>

<template>
  <div class="site">
    <a class="skip-link" href="#main">{{ shell.labels.skipToContent }}</a>
    <SiteMenu v-model:open="menuOpen" />
    <SiteHeader :menu-open="menuOpen" @open-menu="menuOpen = true" />
    <main id="main" tabindex="-1" class="site-main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
