import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const { version: VERSION } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

/**
 * tools.muzanella.com (Stories 20-25). Every calculation runs in the
 * browser; the Nitro server only renders pages (SWR-cached so CMS registry
 * changes show up without a rebuild, Story 25) and proxies the tracking,
 * tools-config, and gold-price requests.
 */
export default defineNuxtConfig({
  compatibilityDate: '2026-09-05',
  workspaceDir: '../../',
  // No `@pinia/nuxt`: nothing here needs a store, and enem-landing-web
  // found that its SSR payload plugin crashes error pages.
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 8002,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id', 'data-version': VERSION },
      titleTemplate: '%s | Tools muzanella',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#0E7C6B' },
        // Site-wide Open Graph defaults; each page sets its own title,
        // description, URL, and image (see ToolShell.vue / useToolsSeo).
        { property: 'og:site_name', content: 'Tools muzanella' },
        { property: 'og:locale', content: 'id_ID' },
        {
          name: 'robots',
          content: 'index, follow, max-image-preview:large, max-snippet:-1',
        },
      ],
    },
  },
  runtimeConfig: {
    // Server-only: the BFF routes are the only thing that talks to
    // enem-landing-api, the browser never sees this host.
    apiHost: process.env['API_HOST'] || 'http://localhost:3001',
    public: {
      siteUrl: 'https://tools.muzanella.com',
      // Build date (YYYY-MM-DD) for sitemap <lastmod>: content changes ship
      // with a deploy, so the build date is an honest "last modified".
      buildDate: new Date().toISOString().slice(0, 10),
      adsenseSlotResult: '',
      adsenseSlotSidebar: '',
    },
  },
  typescript: {
    // See refactor/README.md: `true` breaks `nuxt build` under this
    // Nx/Nuxt/TS combo.
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json',
    },
  },
  imports: {
    autoImport: true,
  },
  // Our own stylesheet carries the @tailwind directives and the shared
  // component classes (.card, .field-input, ...), so the module must not
  // inject its default one on top.
  css: ['~/assets/css/tailwind.css'],
  tailwindcss: { cssPath: false },
  vite: {
    resolve: { tsconfigPaths: true },
    worker: { format: 'es' },
  },
  nitro: {
    publicAssets: [
      {
        dir: fileURLToPath(
          new URL('../../libs/frontend/src/assets/images', import.meta.url),
        ),
      },
    ],
  },
  routeRules: {
    // Pages: rendered by Nitro and cached with stale-while-revalidate, so
    // the registry from the CMS (order, on/off, ads, donation) is picked up
    // within ~10 minutes without a rebuild (Story 25, decision 7).
    '/**': { swr: 600 },
    // BFF routes manage their own caching (or must never be cached).
    '/api/**': { swr: false, cache: false },
    '/sitemap.xml': { swr: 3600 },
    '/favicon.ico': {
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
  },
});
