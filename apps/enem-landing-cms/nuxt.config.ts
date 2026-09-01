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
  modules: ['@pinia/nuxt', 'vuetify-nuxt-module', '@nuxtjs/tailwindcss'],
  // Brand identity ported from mau-apps' mau-account-web
  // (src/plugins/vuetify.ts's `customTheme`) - enem-landing-cms had no
  // custom Vuetify theme at all before this (just the module's untouched
  // Material Design defaults), unlike every other mau-apps dashboard.
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: 'enemLandingCms',
        themes: {
          enemLandingCms: {
            dark: false,
            colors: {
              primary: '#ff318c',
              secondary: '#6d1a57',
              accent: '#d16bb7',
              error: '#e53935',
              info: '#1e88e5',
              success: '#43a047',
              warning: '#fb8c00',
            },
          },
        },
      },
    },
  },
  devtools: { enabled: true },
  devServer: {
    host: 'localhost',
    port: 4000,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en', 'data-version': VERSION },
    },
  },
  runtimeConfig: {
    // Server-only: the BFF routes are the only thing that ever talks to
    // enem-landing-api / enem-landing-account-api directly, the browser
    // never sees these hosts.
    apiHost: process.env['API_HOST'] || 'http://localhost:3001',
    accountApiHost: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
    public: {
      // Not sensitive — needed client-side by useAuthGuard to build the
      // signin redirect URL, and by useAuthCookie to set the shared-domain
      // cookie.
      accountWebHost:
        process.env['ACCOUNT_WEB_HOST'] || 'http://localhost:8000',
      sharedCookieDomain: process.env['SHARED_COOKIE_DOMAIN'] || '',
    },
  },
  experimental: {
    // auth.global.ts's role check awaits a whoami fetch before calling
    // navigateTo - without native async context, that composable call
    // after the await throws "called outside a Nuxt instance" (mirrors
    // the documented mau-apps fix in mau-account-web/nuxt.config.ts).
    asyncContext: true,
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
      {
        dir: fileURLToPath(
          new URL('../../libs/frontend/src/assets/images', import.meta.url),
        ),
      },
    ],
  },
});
