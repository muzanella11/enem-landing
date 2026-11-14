import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    // This route runs server-side, so the outgoing request to
    // enem-landing-api would otherwise carry Nuxt's own User-Agent/
    // Accept-Language instead of the visitor's - forward the originals
    // explicitly so device/browser/OS parsing reflects the real visitor.
    //
    // The visitor's IP is forwarded by createApiClient itself (from
    // Cloudflare's `CF-Connecting-IP`): without it every session would get
    // this container's non-routable Docker-network address, which also
    // breaks the geolocation lookup downstream.
    return await createApiClient(event).post(
      '/tracking/session',
      { ...body, site: 'landing' },
      {
        headers: {
          'user-agent': getHeader(event, 'user-agent') ?? '',
          'accept-language': getHeader(event, 'accept-language') ?? '',
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
