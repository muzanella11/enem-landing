import type { User } from '@enem-landing/shared-types';
import { navigateTo, useRequestURL, useRuntimeConfig } from 'nuxt/app';
import { useAuthCookie } from './use-auth-cookie.js';
import { fetchWhoami } from './use-whoami.js';

interface MinimalRoute {
  fullPath: string;
}

/**
 * Ported from mau-apps
 * (`libs/frontend/src/composables/use-mau-auth-guard.ts`) — shared guard
 * for the "redirect to central signin if not authenticated" middleware
 * pattern, so it isn't duplicated per consumer app's `middleware/auth.global.ts`
 * (currently just `enem-landing-cms`, Story 07 — the first consumer;
 * extract further only if a second one needs it).
 *
 * A stale/invalid token is cleared before bouncing to signin so it can't
 * keep tricking other apps that share the same cookie.
 */
export const buildAccountWebSigninUrl = (to: MinimalRoute): string => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const r = encodeURIComponent(`${requestUrl.origin}${to.fullPath}`);
  return `${config.public.accountWebHost}/signin?r=${r}`;
};

export interface UseAuthGuardOptions {
  /** Validate the token against this app's own /api/auth/whoami before trusting it. */
  validate?: boolean;
  /** Called with the resolved user (only when `validate` is true) to decide if they're allowed on `to`. */
  authorize?: (user: User) => boolean;
  /** Where an authenticated-but-unauthorized user is sent. Defaults to `/unauthorized`. */
  onUnauthorized?: () => ReturnType<typeof navigateTo>;
}

export const useAuthGuard = async (
  to: MinimalRoute,
  options: UseAuthGuardOptions = {},
) => {
  const { validate = false, authorize, onUnauthorized } = options;
  const { token: activeToken, clearToken } = useAuthCookie();

  const redirectToSignin = () => {
    clearToken();
    return navigateTo(buildAccountWebSigninUrl(to), { external: true });
  };

  if (!activeToken.value) {
    return redirectToSignin();
  }

  if (!validate) return;

  const user = await fetchWhoami(activeToken.value);

  if (!user) {
    return redirectToSignin();
  }

  if (authorize && !authorize(user)) {
    return onUnauthorized ? onUnauthorized() : navigateTo('/unauthorized');
  }
};
