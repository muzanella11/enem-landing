import type { ToolsPublicConfig } from '@enem-landing/shared-types';
import { NOMINAL_TOKEN } from '../../app/data/listrik/tarif';
import { NOMINAL_GAJI } from '../../app/data/distribusi';
import { DAFTAR_SURAT } from '../../app/data/surat';
import { SATUAN_LOKAL } from '../../app/data/satuan';
import { KOTA } from '../../app/data/sholat/kota';
import { UMP_PROVINSI } from '../../app/data/upah-minimum';
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

  const urls = [
    '',
    ...tools.map((tool) => `/${tool.slug}`),
    // Per-province pages exist only while the upah-minimum tool is enabled.
    ...(tools.some((tool) => tool.slug === 'upah-minimum')
      ? UMP_PROVINSI.map((provinsi) => `/upah-minimum/${provinsi.slug}`)
      : []),
    // Per-city pages (Story 36), only while their tool is enabled.
    ...(['jadwal-sholat', 'jadwal-imsakiyah'] as const).flatMap((slug) =>
      tools.some((tool) => tool.slug === slug)
        ? KOTA.map((kota) => `/${slug}/${kota.slug}`)
        : [],
    ),
    // Token answer pages (Story 37).
    ...(tools.some((tool) => tool.slug === 'kalkulator-token-listrik')
      ? NOMINAL_TOKEN.map((nominal) => `/token-listrik/${nominal}`)
      : []),
    // Local land-unit answer pages (Story 40).
    ...(tools.some((tool) => tool.slug === 'konversi-luas-tanah')
      ? SATUAN_LOKAL.map((satuan) => `/konversi-luas-tanah/${satuan.slug}`)
      : []),
    // Letter types (Story 33).
    ...(tools.some((tool) => tool.slug === 'buat-surat')
      ? DAFTAR_SURAT.map((surat) => `/buat-surat/${surat.slug}`)
      : []),
    // Answer pages (Story 49).
    ...(tools.some((tool) => tool.slug === 'kalkulator-gaji-bersih')
      ? NOMINAL_GAJI.map((nominal) => `/gaji-bersih/${nominal}`)
      : []),
    ...(tools.some((tool) => tool.slug === 'kalkulator-thr')
      ? NOMINAL_GAJI.map((nominal) => `/thr/${nominal}`)
      : []),
    '/pasang-widget',
    '/privasi',
  ];
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
