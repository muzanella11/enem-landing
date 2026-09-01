import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

const { version: VERSION } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 8000,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-version': VERSION },
    },
  },
  runtimeConfig: {
    // Server-only: the BFF routes are the only thing that ever talks to
    // enem-landing-account-api directly, the browser never sees this host.
    accountApiHost: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
    public: {
      // Not sensitive — needed client-side to set the shared-domain cookie.
      sharedCookieDomain: process.env['SHARED_COOKIE_DOMAIN'] || '',
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
  css: ['~/assets/css/styles.css'],
  vite: {
    plugins: [nxViteTsPaths()],
  },
  nitro: {
    // Shared brand assets (favicon) live once in libs/frontend, mounted
    // here at the public root — mirrors mau-apps' publicAssets pattern.
    publicAssets: [
      { dir: fileURLToPath(new URL('../../libs/frontend/src/assets/images', import.meta.url)) },
    ],
  },
});
