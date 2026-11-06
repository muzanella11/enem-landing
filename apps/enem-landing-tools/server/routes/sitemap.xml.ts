import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { TOOLS_SNAPSHOT } from '../../shared/tools-registry';
import { createApiClient } from '../utils/api-client';

/** Only enabled tools are listed (Story 25); disabled ones are `noindex`. */
export default defineEventHandler(async (event) => {
  const { siteUrl, buildDate } = useRuntimeConfig().public as {
    siteUrl: string;
    buildDate: string;
  };
  let tools = TOOLS_SNAPSHOT.tools;
  try {
    const config = (await createApiClient().get(
      '/tools/config',
    )) as unknown as ToolsPublicConfig;
    tools = config.tools;
  } catch {
    // Snapshot keeps the sitemap valid while the API is down.
  }

  const urls = ['', ...tools.map((tool) => `/${tool.slug}`), '/privasi'];
  const body = urls
    .map(
      (path) =>
        `  <url><loc>${siteUrl}${path}</loc><lastmod>${buildDate}</lastmod></url>`,
    )
    .join('\n');

  setHeader(event, 'content-type', 'application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
});
