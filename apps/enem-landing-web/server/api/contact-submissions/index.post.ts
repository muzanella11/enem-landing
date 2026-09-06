import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    // Forward the real client IP - enem-landing-api's per-IP rate limiter
    // (contact-submissions.service.ts) keys on `req.ip`, which without
    // this resolves to THIS container's own Docker-network address for
    // every visitor (enem-landing-api is internal-only, its one trusted
    // hop is this BFF call, not Traefik - see main.ts's `trust proxy`
    // comment). That collapsed the limit to one shared quota across every
    // visitor instead of one per visitor - 5 submissions from anyone
    // within a minute 429'd everyone else too.
    return await createApiClient().post('/contact-submissions', body, {
      headers: {
        'x-forwarded-for': getRequestIP(event, { xForwardedFor: true }) ?? '',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
