import { createAxiosInstance } from '@enem-landing/shared-utils';
import type { H3Event } from 'h3';
import { getClientIp } from './client-ip.js';

/**
 * All routes this app calls on `enem-landing-api` are public (no auth
 * token needed) - unlike `enem-landing-cms`'s BFF client. This still keeps
 * the API host off the browser bundle and lets pages use Nuxt's SSR
 * `useFetch` idiom against a same-origin path.
 */
export const createApiClient = (event: H3Event) => {
  const config = useRuntimeConfig();
  return createAxiosInstance({
    baseURL: config.apiHost as string,
    // Every call carries the visitor's IP: the API rate-limits per IP, and
    // without it all visitors would share this container's single quota.
    forwardedFor: getClientIp(event),
    onRetryAfter: (retryAfter) =>
      event.node.res.setHeader('Retry-After', retryAfter),
    // enem-landing-api wraps every payload in successResponse; BFF routes
    // pass the bare data through to pages.
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
