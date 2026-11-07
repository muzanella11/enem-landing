import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { publisherIdFromClientId } from '@enem-landing/shared-utils';
import { createApiClient } from '../../utils/api-client.js';

/**
 * The AdSense client id for the `google-adsense-account` verification tag.
 * AdSense registers muzanella.com (the root domain) as the site, so the tag
 * has to be on this app's pages too, even though ads only run on the tools
 * subdomain. The tag loads no ad script. Never fails the page: any API
 * error or invalid id resolves to `{ clientId: null }`.
 */
export default defineEventHandler(async (): Promise<{ clientId: string | null }> => {
  try {
    const config = (await createApiClient().get(
      '/tools/config',
    )) as unknown as ToolsPublicConfig;
    const clientId = config.settings.adsenseClientId?.trim() ?? null;
    return { clientId: publisherIdFromClientId(clientId) ? clientId : null };
  } catch {
    return { clientId: null };
  }
});
