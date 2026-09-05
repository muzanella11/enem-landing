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
  // Vuetify-only, no Tailwind - mirrors mau-apps' convention of never
  // mixing the two on the same app (they collided: Tailwind's CSS was
  // beating Vuetify's own component styles, e.g. outlined field borders
  // and button padding/background computing to nothing).
  modules: ['@pinia/nuxt', 'vuetify-nuxt-module'],
  // Brand identity matches enem-landing-account-web's signin page (its
  // teal `#1ABC9C` / `#3FCBAF` / `#15967D` palette) so the CMS reads as
  // the same product family, not mau-apps' pink.
  vuetify: {
    moduleOptions: {
      // useLayout collides with Nuxt's built-in auto-imported composable of
      // the same name - prefix Vuetify's version to useVLayout instead.
      prefixComposables: ['useLayout'],
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'enemLandingCms',
        themes: {
          enemLandingCms: {
            dark: false,
            colors: {
              primary: '#1abc9c',
              secondary: '#15967d',
              accent: '#3fcbaf',
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
      title: 'Enem Landing CMS',
      titleTemplate: '%s - Enem Landing CMS',
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
    resolve: { tsconfigPaths: true },
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
