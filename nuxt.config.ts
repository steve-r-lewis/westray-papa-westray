export default defineNuxtConfig({
  // Theme Manager, pinned in package.json to its v0.2.1 commit.
  extends: ['@nuxt4-layers/theme-manager'],
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  hooks: {
    // Theme Manager's management pages stay hidden until group administration
    // (slice 2) gives them a home; every change they offer is refused until then.
    'pages:extend'(pages) {
      const managed = pages.filter(page => page.path.startsWith('/theme-manager'))
      for (const page of managed) pages.splice(pages.indexOf(page), 1)
    },
  },
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/images/logo.png' }],
      script: [{
        // Sets light or dark before first paint, so the page never flashes the
        // wrong mode; app/composables/useColourMode.ts keeps it right afterwards.
        tagPosition: 'head',
        innerHTML: `(function(){try{var m=document.cookie.match(/(?:^|; )colour-mode=([^;]*)/);var p=m?decodeURIComponent(m[1]):'system';var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light'}catch(_){}})()`,
      }],
    },
  },
  typescript: {
    strict: true,
    // Type-check tests and scripts too, not only the app and server.
    tsConfig: {
      include: ['../tests/nuxt/**/*'],
    },
    nodeTsConfig: {
      include: ['../scripts/**/*', '../tests/unit/**/*', '../vitest.config.ts'],
      compilerOptions: { allowImportingTsExtensions: true },
    },
  },
})
