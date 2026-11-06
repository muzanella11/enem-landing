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
    tools: config.value.tools.filter((tool) => tool.category === category),
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
          itemListElement: config.value.tools.map((tool, index) => ({
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

    <section v-for="group in groups" :key="group.category" class="mt-10">
      <h2 class="text-lg font-semibold text-slate-800">{{ group.label }}</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="tool in group.tools" :key="tool.slug">
          <NuxtLink
            :to="`/${tool.slug}`"
            class="card flex h-full flex-col transition hover:border-teal-600 hover:shadow-md"
          >
            <span class="flex items-center gap-2">
              <span class="font-semibold text-slate-900">{{ tool.name }}</span>
              <span
                v-if="tool.badge"
                class="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium capitalize text-teal-800"
                >{{ tool.badge }}</span
              >
            </span>
            <span class="mt-2 text-sm text-slate-600">{{
              tool.shortDescription
            }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
