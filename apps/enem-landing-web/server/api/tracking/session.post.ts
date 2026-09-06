import { createApiClient, handleApiError } from '../../utils/api-client.js';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    // This route runs server-side, so the outgoing request to
    // enem-landing-api would otherwise carry Nuxt's own User-Agent/
    // Accept-Language instead of the visitor's - forward the originals
    // explicitly so device/browser/OS parsing reflects the real visitor.
    //
    // Also forward the real client IP explicitly: enem-landing-api is
    // internal-only (traefik.enable=false, never hit by Traefik directly),
    // so its own `trust proxy` config trusts THIS axios call as its one
    // hop - but a plain axios call carries no X-Forwarded-For on its own.
    // Without this, `req.ip` there just resolves to this container's own
    // Docker-network address (seen in prod as `::ffff:10.0.1.x`), and every
    // recorded session gets that same non-routable IP instead of the
    // visitor's - which also breaks the ip-api.com geolocation lookup
    // downstream (no country/region/city/lat-long for a private IP).
    // `getRequestIP(..., { xForwardedFor: true })` reads the value Traefik
    // already set correctly (it trusts Cloudflare's forwarded-for per
    // traefik-stack.yml.j2).
    return await createApiClient().post('/tracking/session', body, {
      headers: {
        'user-agent': getHeader(event, 'user-agent') ?? '',
        'accept-language': getHeader(event, 'accept-language') ?? '',
        'x-forwarded-for': getRequestIP(event, { xForwardedFor: true }) ?? '',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
