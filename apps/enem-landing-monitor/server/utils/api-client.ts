import { createAxiosInstance } from '@enem-landing/shared-utils';
import type { H3Event } from 'h3';
import { getClientIp } from './client-ip';

const AUTH_TOKEN_COOKIE = 'ENEM_LANDING_AUTH_TOKEN';

/** The SuperAdmin's own token from the shared SSO cookie. */
export const getAuthToken = (event: H3Event): string | undefined => {
  const cookieName =
    (useRuntimeConfig().public.authCookieName as string) || AUTH_TOKEN_COOKIE;
  return getCookie(event, cookieName) ?? undefined;
};

/**
 * Pages never call enem-landing-monitor-api directly: every
 * `server/api/**` route proxies through this client, forwarding the
 * user's token and real IP (the API rate-limits per IP).
 */
export const createMonitorApiClient = (event: H3Event) => {
  const config = useRuntimeConfig();
  return createAxiosInstance({
    baseURL: config.monitorApiHost as string,
    token: getAuthToken(event),
    forwardedFor: getClientIp(event),
    onRetryAfter: (retryAfter: string) =>
      event.node.res.setHeader('Retry-After', retryAfter),
    unwrapEnvelope: true,
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
