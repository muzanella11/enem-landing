import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { buildAdsTxt } from '@enem-landing/shared-utils';
import { createApiClient } from '../utils/api-client';

/**
 * Root-domain /ads.txt. AdSense registers muzanella.com as the site and
 * crawls this file first; subdomain ads.txt files are only honoured when
 * listed here via `subdomain=`. Ads themselves only run on the tools
 * subdomain, this file just declares the authorised seller. Uses the same
 * publisher id the CMS sets for tools; 404 until one is configured.
 */
export default defineEventHandler(async (event) => {
  const { adsTxtSubdomains } = useRuntimeConfig();
  let body: string | null;
  try {
    const config = (await createApiClient(event).get(
      '/tools/config',
    )) as unknown as ToolsPublicConfig;
    body = buildAdsTxt(
      config.settings.adsenseClientId,
      String(adsTxtSubdomains ?? '').split(','),
    );
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
