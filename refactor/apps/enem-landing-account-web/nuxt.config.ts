import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { defineNuxtConfig } from 'nuxt/config';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  workspaceDir: '../../',
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 8000,
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
});
