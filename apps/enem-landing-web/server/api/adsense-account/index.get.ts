import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { publisherIdFromClientId } from '@enem-landing/shared-utils';
import { createApiClient } from '../../utils/api-client.js';

interface AdsenseAccount {
  clientId: string | null;
  /**
   * Ad unit for blog articles (Story 56). Non-null only when the global ad
   * switch AND the blog ad switch are on, the publisher id is valid, and a
   * numeric slot id is set, so the page needs no further checks.
   */
  articleSlot: string | null;
}

const SLOT_PATTERN = /^\d{6,20}$/;

/**
 * The AdSense client id for the `google-adsense-account` verification tag.
 * AdSense registers muzanella.com (the root domain) as the site, so the tag
 * has to be on this app's pages too. The tag loads no ad script; ads only
 * load in blog articles once `articleSlot` is set. Never fails the page:
 * any API error or invalid id resolves to nulls.
 */
export default defineEventHandler(async (): Promise<AdsenseAccount> => {
  try {
    const config = (await createApiClient().get(
      '/tools/config',
    )) as unknown as ToolsPublicConfig;
    const { settings } = config;
    const clientId = settings.adsenseClientId?.trim() ?? null;
    if (!publisherIdFromClientId(clientId)) {
      return { clientId: null, articleSlot: null };
    }
    const slot = settings.adsenseSlotArticle?.trim() ?? '';
    const articleSlot =
      settings.adsEnabled && settings.blogAdsEnabled && SLOT_PATTERN.test(slot)
        ? slot
        : null;
    return { clientId, articleSlot };
  } catch {
    return { clientId: null, articleSlot: null };
  }
});
