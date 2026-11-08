export interface PublicSettings {
  /** CMS /settings: serve CDN images via Cloudflare Image Transformations. */
  imageTransformsEnabled: boolean;
}

const OFF: PublicSettings = { imageTransformsEnabled: false };

/**
 * The non-secret switches from the CMS Settings page
 * (enem-landing-account-api `GET /system-settings/public`), cached for a
 * minute per server so every render doesn't hit the account API. Any error
 * reads as "everything off".
 */
export const getPublicSettings = defineCachedFunction(
  async (): Promise<PublicSettings> => {
    try {
      const { accountApiHost } = useRuntimeConfig();
      const response = await $fetch<{ data?: Partial<PublicSettings> }>(
        `${String(accountApiHost).replace(/\/$/, '')}/system-settings/public`,
        { timeout: 2000 },
      );
      return {
        imageTransformsEnabled: Boolean(response.data?.imageTransformsEnabled),
      };
    } catch {
      return OFF;
    }
  },
  { name: 'public-settings', maxAge: 60, swr: true },
);
