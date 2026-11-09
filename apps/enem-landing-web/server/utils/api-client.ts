import { createAxiosInstance } from '@enem-landing/shared-utils';

/**
 * All routes this app calls on `enem-landing-api` are public (no auth
 * token needed) - unlike `enem-landing-cms`'s BFF client. This still keeps
 * the API host off the browser bundle and lets pages use Nuxt's SSR
 * `useFetch` idiom against a same-origin path.
 */
export const createApiClient = () => {
  const config = useRuntimeConfig();
  return createAxiosInstance({
    baseURL: config.apiHost as string,
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
