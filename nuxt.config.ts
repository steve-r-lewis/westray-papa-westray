export default defineNuxtConfig({
  // Layers, each pinned in package.json to a release commit:
  // Theme Manager v0.2.1, Configuration v1.2.0.
  extends: ['@nuxt4-layers/theme-manager', '@nuxt4-layers/configuration'],
  // Configuration's administration pages wait for sign-in and approvals (slice 1c).
  configuration: { pages: { enabled: false } },
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
