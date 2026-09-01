import { fileURLToPath, URL } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 8001,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          // Original site's theme (startbootstrap-freelancer) pairs Montserrat
          // (headings/nav) with Lato (body) — same fonts, ported to Tailwind.
          href: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Montserrat:wght@700&display=swap',
        },
      ],
      meta: [{ name: 'format-detection', content: 'telephone=no' }],
    },
  },
  runtimeConfig: {
    // Server-only: the BFF routes are the only thing that ever talks to
    // enem-landing-api directly, the browser never sees this host.
    apiHost: process.env['API_HOST'] || 'http://localhost:3001',
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
  css: ['~/assets/css/styles.css', '@enem-landing/frontend/assets/scss/main.scss'],
  vite: {
    plugins: [nxViteTsPaths()],
  },
  nitro: {
    // Shared brand assets (favicon, avatar, OG image) live once in
    // libs/frontend, mounted here at the public root instead of being
    // duplicated into every app's own public/ dir — mirrors mau-apps'
    // publicAssets pattern.
    publicAssets: [
      { dir: fileURLToPath(new URL('../../libs/frontend/src/assets/images', import.meta.url)) },
    ],
  },
});
