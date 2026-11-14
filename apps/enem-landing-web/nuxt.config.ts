import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const { version: VERSION } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-05',
  workspaceDir: '../../',
  // `@enem-landing/frontend`'s package.json only exports the module root -
  // this aliases its `assets/` subpath directly to source so `css` below
  // can reference `@enem-landing/frontend/assets/scss/main.scss`, mirroring
  // mau-apps' own `@mau-apps/frontend/assets` alias.
  alias: {
    '@enem-landing/frontend/assets': fileURLToPath(
      new URL('../../libs/frontend/src/assets', import.meta.url),
    ),
  },
  // No `@pinia/nuxt` here: this app has never consumed the shared
  // `useAppStore` (see libs/frontend/src/stores/app.ts) or defined a store
  // of its own, and the module's SSR payload plugin was the direct cause
  // of every 404/error page crashing with 500 (pinia's `shouldHydrate`
  // throwing `obj.hasOwnProperty is not a function` while `devalue`
  // serializes the Nuxt error page's payload). Removing the unused module
  // removes the code path entirely rather than patching around it.
  // VeeValidate powers the contact form's validation (Zod schema).
  modules: ['@nuxtjs/tailwindcss', '@vee-validate/nuxt'],
  $production: {
    nitro: {
      routeRules: {
        // Generated from the published posts (server/routes/sitemap.xml.ts);
        // an hour of staleness is fine for crawlers and keeps the paginated
        // API walk off every request. Production only, so the dev server
        // (and e2e) always reflects posts published moments ago.
        '/sitemap.xml': { swr: 3600 },
      },
    },
  },
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 8001,
  },
  // PageSpeed: the two small stylesheets (Tailwind entry + one component
  // chunk) were the only render-blocking requests left on the homepage.
  // Inlining them into the SSR HTML removes that round trip.
  features: { inlineStyles: true },
  hooks: {
    // PageSpeed: Nuxt adds <link rel="prefetch"> for every lazy chunk of
    // the entry, which on the homepage meant downloading rrweb (~250 KB,
    // only needed by the few sampled session recordings) and the blog
    // article chunk while the page itself was still loading. Lazy chunks
    // still load on demand; they're just no longer prefetched.
    'build:manifest': (manifest) => {
      for (const chunk of Object.values(manifest)) {
        chunk.prefetch = false;
      }
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-version': VERSION },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Lato/Montserrat are self-hosted: see the @font-face rules at the
        // top of app/assets/css/styles.css.
      ],
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        // Colors the mobile browser UI chrome (address bar on Android
        // Chrome, tab bar area on iOS Safari) to match the site's brand
        // teal (see Masthead.vue's header background).
        { name: 'theme-color', content: '#0E7C6B' },
      ],
      // Cloudflare Web Analytics is loaded by app/plugins/cf-beacon.client.ts
      // on the first interaction, like GA (PageSpeed).
    },
  },
  runtimeConfig: {
    // Server-only: the BFF routes are the only thing that ever talks to
    // enem-landing-api directly, the browser never sees this host.
    apiHost: process.env['API_HOST'] || 'http://localhost:3001',
    // Server-only: read for the public system settings (CMS /settings
    // switches like Cloudflare Image Transformations). Override with
    // NUXT_ACCOUNT_API_HOST.
    accountApiHost: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
    // Comma-separated hosts listed as `subdomain=` in /ads.txt.
    // Override with NUXT_ADS_TXT_SUBDOMAINS.
    adsTxtSubdomains: 'tools.muzanella.com',
    public: {
      // GA4 measurement id (G-...), set at runtime via
      // NUXT_PUBLIC_GA_MEASUREMENT_ID. Empty = no Google Analytics.
      // Loaded by app/plugins/google-analytics.client.ts.
      gaMeasurementId: '',
      // Tools site linked from the nav, footer, and homepage. Override per
      // environment with NUXT_PUBLIC_TOOLS_HOST (dev: dev-tools.muzanella.com).
      toolsHost: 'https://tools.muzanella.com',
    },
  },
  typescript: {
    // See refactor/README.md: default `true` breaks `nuxt build` under this
    // Nx/Nuxt/TS combo (TS6305 from conflicting composite project refs).
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json', // Nuxt copies this string as-is to the `./.nuxt/tsconfig.json`, therefore it needs to be relative to that directory
    },
  },
  imports: {
    autoImport: true,
  },
  css: [
    '~/assets/css/styles.css',
    '@enem-landing/frontend/assets/scss/main.scss',
  ],
  vite: {
    resolve: { tsconfigPaths: true },
  },
  nitro: {
    // Shared brand assets (favicon, avatar, OG image) live once in
    // libs/frontend, mounted here at the public root instead of being
    // duplicated into every app's own public/ dir — mirrors mau-apps'
    // publicAssets pattern.
    publicAssets: [
      {
        dir: fileURLToPath(
          new URL('../../libs/frontend/src/assets/images', import.meta.url),
        ),
      },
    ],
    routeRules: {
      // No route cache for /ads.txt or /api/adsense-account: with `swr: 600`
      // prod kept serving a stale `{ clientId: null }` long after the
      // publisher id was set in the CMS, so the verification tag never
      // appeared. The API already caches /tools/config in Redis and clears
      // it on every settings save, so both stay cheap without a second cache.
      // These are committed repo assets (favicon, avatar, OG image), not
      // user uploads - they only change via a new deploy, so a long cache
      // is safe. PageSpeed Insights flagged /avataaars.svg's default cache
      // duration (4h) as too short.
      '/avataaars.svg': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/favicon.ico': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/enem.png': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/og-image.png': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      // Committed fallback images (image-not-available.svg), same reasoning;
      // Pingdom flagged their 4h default.
      // Self-hosted fonts (versioned only by deploys, same as above).
      '/fonts/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
      '/img/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      },
    },
  },
});
