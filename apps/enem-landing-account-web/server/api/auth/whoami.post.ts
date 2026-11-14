import { createAxiosInstance } from '@enem-landing/shared-utils';
import { getClientIp } from '../../utils/client-ip';

/** BFF proxy for `POST /auth/whoami` — used by the bounce-back-if-already-authenticated check. */
export default defineEventHandler(async (event) => {
  const secret = getHeader(event, 'x-enem-landing-secret');
  if (!secret) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' });
  }

  const authHeader = getHeader(event, 'x-enem-landing-authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const config = useRuntimeConfig();
  const client = createAxiosInstance({
    baseURL: config.accountApiHost as string,
    // The account API rate-limits per visitor IP (sign-in is a
    // brute-force target), so forward it instead of this container's.
    forwardedFor: getClientIp(event),
    onRetryAfter: (retryAfter) =>
      event.node.res.setHeader('Retry-After', retryAfter),
    token,
  });

  try {
    return await client.post('/auth/whoami');
  } catch (error) {
    const axiosError = error as {
      response?: { status: number; data?: { message?: string } };
    };
    throw createError({
      statusCode: axiosError.response?.status || 500,
      statusMessage:
        axiosError.response?.data?.message || 'Failed to fetch current user',
    });
  }
});
