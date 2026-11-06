import {
  createApiClient,
  handleApiError,
  TOOLS_SITE,
} from '../../utils/api-client';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    // Forward the visitor's own UA/language/IP (see enem-landing-web's
    // session.post.ts for why), and pin the site server-side so a client
    // can't write sessions into another site's data.
    return await createApiClient().post(
      '/tracking/session',
      { ...body, site: TOOLS_SITE },
      {
        headers: {
          'user-agent': getHeader(event, 'user-agent') ?? '',
          'accept-language': getHeader(event, 'accept-language') ?? '',
          'x-forwarded-for': getRequestIP(event, { xForwardedFor: true }) ?? '',
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
