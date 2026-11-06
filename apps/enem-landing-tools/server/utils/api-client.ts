import { createAxiosInstance } from '@enem-landing/shared-utils';

/**
 * All routes this app calls on enem-landing-api are public. Going through
 * this BFF keeps the API host off the browser bundle (same pattern as
 * enem-landing-web).
 */
export const createApiClient = () => {
  const config = useRuntimeConfig();
  const client = createAxiosInstance({ baseURL: config.apiHost as string });
  // Shorter than the shared 10s default: a slow API must not hold up a
  // page render, the callers all have a fallback.
  client.defaults.timeout = 5000;
  return client;
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

/** Every tracking request from this app belongs to the tools site (Story 25). */
export const TOOLS_SITE = 'tools' as const;
