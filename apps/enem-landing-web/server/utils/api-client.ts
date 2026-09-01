import { createAxiosInstance } from '@enem-landing/shared-utils';

/**
 * All routes this app calls on `enem-landing-api` are public (no auth
 * token needed) - unlike `enem-landing-cms`'s BFF client. This still keeps
 * the API host off the browser bundle and lets pages use Nuxt's SSR
 * `useFetch` idiom against a same-origin path.
 */
export const createApiClient = () => {
  const config = useRuntimeConfig();
  return createAxiosInstance({ baseURL: config.apiHost as string });
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
