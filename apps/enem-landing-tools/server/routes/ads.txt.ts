import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { buildAdsTxt } from '../../shared/adsense';
import { createApiClient } from '../utils/api-client';

/**
 * /ads.txt from the AdSense publisher id set in the CMS (Story 27). 404
 * until a publisher id is configured. Cached by routeRules.
 */
export default defineEventHandler(async (event) => {
  let body: string | null;
  try {
    const config = (await createApiClient().get(
      '/tools/config',
    )) as unknown as ToolsPublicConfig;
    body = buildAdsTxt(config.settings.adsenseClientId);
  } catch {
    body = null;
  }
  if (!body) {
    throw createError({
      statusCode: 404,
      statusMessage: 'ads.txt not configured',
    });
  }
  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return body;
});
