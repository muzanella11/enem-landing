/**
 * Open Graph and Twitter tags for one page (SEO). Images are the 1200x630
 * PNGs generated at build time into /og (scripts/generate-og-images.mjs);
 * `ogKey` is the tool slug, or `default` for non-tool pages.
 */
export const usePageSeo = (options: {
  title: string;
  description: string;
  path: string;
  ogKey?: string;
  robots?: () => string;
}) => {
  const siteUrl = useRuntimeConfig().public.siteUrl as string;
  const url = `${siteUrl}${options.path}`;
  const image = `${siteUrl}/og/${options.ogKey ?? 'default'}.png`;

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogUrl: url,
    ogType: 'website',
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageType: 'image/png',
    ogImageAlt: options.title,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: image,
    twitterImageAlt: options.title,
    ...(options.robots ? { robots: options.robots } : {}),
  });
  useHead({ link: [{ rel: 'canonical', href: url }] });

  return { siteUrl, url };
};
