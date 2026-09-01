import { computed } from 'vue';
import { useCookie, useRequestURL, useRuntimeConfig } from 'nuxt/app';
import { AUTH_TOKEN_COOKIE } from '../constants/index.js';

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

/**
 * Ported from mau-apps (`libs/frontend/src/composables/use-mau-auth-cookie.ts`).
 * Sets `domain: <SHARED_COOKIE_DOMAIN>` only on a real (non-loopback) host,
 * so the same auth cookie is readable across every `*.<domain>` subdomain
 * in production (`enem-landing-cms`, `enem-landing-account-web`, ...).
 * Local dev doesn't need this — cookies aren't port-scoped, so
 * `localhost:4000` and `localhost:8000` already see the same cookie.
 *
 * Extracted from `enem-landing-account-web` (Story 04) into this shared
 * lib now that `enem-landing-cms` (Story 07) is a second consumer.
 */
export const useAuthCookie = () => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const isLoopback = LOOPBACK_HOSTNAMES.has(requestUrl.hostname);
  const sharedDomain = config.public.sharedCookieDomain as string;

  const cookie = useCookie<string | null>(AUTH_TOKEN_COOKIE, {
    sameSite: 'lax',
    path: '/',
    domain: !isLoopback && sharedDomain ? sharedDomain : undefined,
  });

  const token = computed(() => cookie.value);

  const setToken = (value: string) => {
    cookie.value = value;
  };

  const clearToken = () => {
    cookie.value = null;
  };

  return { token, setToken, clearToken };
};
