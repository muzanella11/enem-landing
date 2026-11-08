<script setup lang="ts">
import type { ToolCategoryValue } from '@enem-landing/shared-types';

const { config } = useToolsConfig();

const CATEGORY_LABELS: Record<ToolCategoryValue, string> = {
  keuangan: 'Keuangan dan bisnis',
  dokumen: 'Dokumen, PDF, dan gambar',
  ibadah: 'Ibadah',
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan dan karier',
};
const CATEGORY_ORDER: ToolCategoryValue[] = [
  'keuangan',
  'dokumen',
  'kesehatan',
  'pendidikan',
  'ibadah',
];

const groups = computed(() =>
  CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    tools: config.value.tools.filter(
      (tool) => tool.category === category && tool.enabled !== false,
    ),
  })).filter((group) => group.tools.length > 0),
);

const title = 'Tools gratis berbahasa Indonesia';
const description =
  'Kalkulator gaji bersih PPh 21 TER, simulasi KPR, kalkulator zakat, alat PDF dan gambar, serta pembuat invoice. Semua berjalan di browser, data kamu tidak dikirim ke server.';

useSeoMeta({ titleTemplate: '%s' });
const { siteUrl } = usePageSeo({ title, description, path: '/' });

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Tools muzanella',
        url: `${siteUrl}/`,
        inLanguage: 'id-ID',
        publisher: {
          '@type': 'Person',
          name: 'Nurfirliana Muzanella',
          url: 'https://muzanella.com',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: () =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Daftar tools',
          itemListElement: config.value.tools
            .filter((tool) => tool.enabled !== false)
            .map((tool, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: tool.name,
              url: `${siteUrl}/${tool.slug}`,
            })),
        }),
    },
  ],
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <section class="max-w-3xl">
      <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
        Tools gratis untuk urusan sehari-hari
      </h1>
      <p class="mt-3 text-lg text-slate-600">
        Hitung gaji bersih, cicilan KPR, dan zakat, atau olah PDF dan foto.
        Semua dikerjakan di browsermu: angka dan file yang kamu isi tidak pernah
        di-upload.
      </p>
    </section>

    <LazyToolGrid :groups="groups" hydrate-never />
  </div>
</template>
