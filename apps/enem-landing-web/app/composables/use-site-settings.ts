import { cdnImageSrcset, cdnImageUrl } from '@enem-landing/shared-utils';

/** Site-wide switches from the CMS Settings page, fetched once per render. */
export const useSiteSettings = () =>
  useFetch<{ imageTransformsEnabled: boolean }>('/api/site-settings', {
    key: 'site-settings',
    default: () => ({ imageTransformsEnabled: false }),
  });

/**
 * Resized CDN image URLs (Cloudflare Image Transformations), following the
 * CMS switch. Off: the original URLs, unchanged.
 */
export const useCdnImage = () => {
  const { data } = useSiteSettings();
  const enabled = computed(() => Boolean(data.value?.imageTransformsEnabled));
  return {
    src: (url: string | null | undefined, width: number) =>
      cdnImageUrl(url, width, enabled.value),
    srcset: (url: string | null | undefined, widths: readonly number[]) =>
      cdnImageSrcset(url, widths, enabled.value),
  };
};
