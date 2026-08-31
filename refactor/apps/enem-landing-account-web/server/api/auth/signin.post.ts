import { createAxiosInstance } from '@enem-landing/shared-utils';

/**
 * BFF proxy for `enem-landing-account`'s `POST /auth/signin` — mirrors
 * mau-apps (`apps/mau-account-landing-web/src/server/api/auth/signin.post.ts`).
 * Keeps the backend host off the browser bundle; the `X-Enem-Landing-Secret`
 * check is a presence-only header, ported verbatim for structural parity
 * (see Story 04 for why it's not real protection in either codebase).
 */
export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-enem-landing-secret');
  if (!secret) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' });
  }

  const body = await readBody(event);
  const config = useRuntimeConfig();
  const client = createAxiosInstance({ baseURL: config.accountApiHost as string });

  try {
    return await client.post('/auth/signin', body);
  } catch (error) {
    const axiosError = error as { response?: { status: number; data?: { message?: string } } };
    throw createError({
      statusCode: axiosError.response?.status || 500,
      statusMessage: axiosError.response?.data?.message || 'Failed to sign in',
    });
  }
});
