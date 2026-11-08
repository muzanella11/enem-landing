/** Same shape as `server/api/adsense-account/index.get.ts` returns. */
export interface AdsenseAccount {
  clientId: string | null;
  articleSlot: string | null;
}

/**
 * AdSense publisher id (verification tag) and the blog article ad unit
 * (Story 56), fetched once per render and shared via the payload.
 */
export const useAdsenseAccount = () =>
  useFetch<AdsenseAccount>('/api/adsense-account', {
    key: 'adsense-account',
    default: () => ({ clientId: null, articleSlot: null }),
  });
