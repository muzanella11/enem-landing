import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    // This route runs server-side, so the outgoing request to
    // enem-landing-api would otherwise carry Nuxt's own User-Agent/
    // Accept-Language instead of the visitor's - forward the originals
    // explicitly so device/browser/OS parsing reflects the real visitor.
    return await createApiClient().post('/tracking/session', body, {
      headers: {
        'user-agent': getHeader(event, 'user-agent') ?? '',
        'accept-language': getHeader(event, 'accept-language') ?? '',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
