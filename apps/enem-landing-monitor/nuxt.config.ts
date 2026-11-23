import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const { version: VERSION } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

/**
 * Not a public site: no crawler should index it and no other origin may
 * frame it. Applied to every response (pages, BFF routes, assets).
 */
const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-05',
  workspaceDir: '../../',
  // Same stack as enem-landing-cms: Vuetify only, no Tailwind. No tracker,
  // Google Analytics or AdSense module on purpose.
  modules: ['@pinia/nuxt', 'vuetify-nuxt-module'],
  vuetify: {
    moduleOptions: {
      prefixComposables: ['useLayout'],
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'enemLandingMonitor',
        themes: {
          enemLandingMonitor: {
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
  devtools: { enabled: false },
  devServer: {
    host: 'localhost',
    port: 4003,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'id', 'data-version': VERSION },
      title: 'Enem Landing Monitor',
      titleTemplate: '%s - Enem Landing Monitor',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },
  routeRules: {
    '/**': { headers: SECURITY_HEADERS },
  },
  runtimeConfig: {
    // Server-only: only the BFF routes (server/api/**) call these.
    monitorApiHost: process.env['MONITOR_API_HOST'] || 'http://localhost:3003',
    accountApiHost: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
    public: {
      accountWebHost:
        process.env['ACCOUNT_WEB_HOST'] || 'http://localhost:8000',
      sharedCookieDomain: process.env['SHARED_COOKIE_DOMAIN'] || '',
      authCookieName: process.env['AUTH_COOKIE_NAME'] || '',
    },
  },
  experimental: {
    // auth.global.ts awaits whoami before navigateTo (see the CMS config).
    asyncContext: true,
  },
  typescript: {
    typeCheck: false,
    tsConfig: {
      extends: '../../../tsconfig.base.json',
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
    publicAssets: [
      {
        dir: fileURLToPath(
          new URL('../../libs/frontend/src/assets/images', import.meta.url),
        ),
      },
    ],
  },
});
