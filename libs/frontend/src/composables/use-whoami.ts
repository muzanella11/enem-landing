import type { User } from '@enem-landing/shared-types';

/**
 * `$fetch` is a Nuxt ambient global (injected by the consuming app's own
 * build, same as mau-apps' `use-mau-whoami.ts` relies on) — it isn't a
 * real export of `nuxt/app`, so this lib's isolated `tsc --build` can't
 * see it without a local type-only declaration. Erased at compile time;
 * doesn't affect the real runtime value Nuxt provides.
 */
declare const $fetch: typeof import('ofetch').$fetch;

interface WhoamiResponse {
  statusCode: number;
  message: string;
  data?: User;
}

/**
 * Calls the CONSUMING app's own `/api/auth/whoami` BFF route (every app
 * that needs auth ships one — `enem-landing-account-web`, Story 04;
 * `enem-landing-cms`, Story 07) to check whether a token is still valid,
 * rather than trusting that the cookie merely exists. Mirrors mau-apps'
 * `fetchMauWhoami`.
 */
export const fetchWhoami = (token: string): Promise<User | null> =>
  $fetch<WhoamiResponse>('/api/auth/whoami', {
    method: 'post',
    headers: {
      'x-enem-landing-secret': 'Secret',
      'x-enem-landing-authorization': `Bearer ${token}`,
    },
  })
    .then((res) => res.data ?? null)
    .catch(() => null);
