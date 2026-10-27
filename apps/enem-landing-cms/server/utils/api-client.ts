import { createAxiosInstance } from '@enem-landing/shared-utils';
import type { H3Event } from 'h3';

const AUTH_TOKEN_COOKIE = 'ENEM_LANDING_AUTH_TOKEN';

/**
 * Shared helper for every BFF route in this app — CMS pages never call
 * `enem-landing-api`/`enem-landing-account-api` directly (keeps those
 * hosts server-only), each `server/api/**` route proxies through one of
 * these two clients instead, forwarding the admin's own token from the
 * shared auth cookie.
 */
export const getAuthToken = (event: H3Event): string | undefined => {
  // Must match useAuthCookie's name (libs/frontend), which honors the same
  // runtime override.
  const cookieName =
    (useRuntimeConfig().public.authCookieName as string) || AUTH_TOKEN_COOKIE;
  return getCookie(event, cookieName) ?? undefined;
};

export const createApiClient = (event: H3Event) => {
  const config = useRuntimeConfig();
  return createAxiosInstance({
    baseURL: config.apiHost as string,
    token: getAuthToken(event),
  });
};

export const createAccountApiClient = (event: H3Event) => {
  const config = useRuntimeConfig();
  return createAxiosInstance({
    baseURL: config.accountApiHost as string,
    token: getAuthToken(event),
  });
};

export const handleApiError = (error: unknown): never => {
  const axiosError = error as {
    response?: { status: number; data?: { message?: string } };
  };
  throw createError({
    statusCode: axiosError.response?.status || 500,
    statusMessage: axiosError.response?.data?.message || 'Request failed',
  });
};
