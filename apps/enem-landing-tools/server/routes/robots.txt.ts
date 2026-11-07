export default defineEventHandler((event) => {
  const siteUrl = useRuntimeConfig().public.siteUrl as string;
  setHeader(event, 'content-type', 'text/plain; charset=utf-8');
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;
});
