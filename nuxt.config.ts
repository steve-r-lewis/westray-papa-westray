export default defineNuxtConfig({
  // Layers, each pinned in package.json to a release commit: Theme Manager v0.2.2,
  // Configuration v1.2.0, Publisher v1.0.0, and the IAM suite (Authentication v1.0.0,
  // Identity v1.0.0, Profile v1.1.0, Authorisation v1.0.0, with iam-integration v1.1.0's
  // adapters between them).
  extends: [
    '@nuxt4-layers/theme-manager',
    '@nuxt4-layers/configuration',
    '@nuxt4-layers/publisher',
    '@nuxt4-layers/authentication',
    '@nuxt4-layers/identity',
    '@nuxt4-layers/profile',
    '@nuxt4-layers/authorisation',
    '@nuxt4-layers/iam-integration',
  ],
  // The site draws every screen itself: the IAM layers' default pages and components
  // are not registered, only their servers, endpoints and composables.
  authentication: { presentation: false },
  identity: { presentation: false },
  profile: { presentation: false },
  authorisation: { presentation: false },
  // Configuration's administration pages wait for editing on the site (slice 1c part 2);
  // its endpoints already ask Authorisation, which grants nothing to anyone yet.
  configuration: { pages: { enabled: false } },
  runtimeConfig: {
    // Publisher's own HTTP API stays off: its administration needs sign-in (slice 1c),
    // and readers go through server/api/content/, which serves only what anyone may read.
    publisher: { api: { enabled: false } },
    public: {
      // The site's own account pages, at the paths Authentication's emails and
      // middleware send people to.
      authentication: {
        routes: {
          signIn: '/sign-in',
          signUp: '/sign-up',
          forgotPassword: '/forgot-password',
          resetPassword: '/reset-password',
          mfa: '/account/second-factor',
          security: '/account/security',
          afterSignIn: '/account',
          afterSignOut: '/',
        },
      },
      identity: { routes: { signIn: '/sign-in' } },
      profile: { routes: { signIn: '/sign-in' } },
      authorisation: { routes: { signIn: '/sign-in' } },
    },
  },
  nitro: {
    // Tasks: each IAM member's outbox relay and maintenance, on the schedule below
    // (Vercel Cron in production; server/tasks/). asyncContext: Theme Manager's actor
    // port takes no request, so it finds the one being served.
    experimental: { tasks: true, asyncContext: true },
    scheduledTasks: {
      '* * * * *': ['iam:relay'],
      '*/10 * * * *': ['iam:maintenance'],
    },
  },
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
      include: ['../scripts/**/*', '../tests/unit/**/*', '../tests/e2e/**/*', '../vitest.config.ts'],
      compilerOptions: { allowImportingTsExtensions: true },
    },
  },
})
