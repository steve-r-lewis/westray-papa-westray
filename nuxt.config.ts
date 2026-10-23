export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', type: 'image/png', href: '/images/logo.png' }],
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
