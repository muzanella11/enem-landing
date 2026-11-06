<script setup lang="ts">
import { findSurat } from '~/data/surat';
import { nilaiContoh, susunSurat } from '~/utils/surat';

const SLUG = 'buat-surat';
const CHECKED_AT = '2026-11-06';
const route = useRoute();
const template = findSurat(String(route.params['jenis']));
if (!template) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Jenis surat tidak ada',
    fatal: true,
  });
}
// Rendered on the server: a full example letter for readers and search engines.
const contoh = susunSurat(template, nilaiContoh(template, CHECKED_AT));
const howTo = [
  'Isi kolom di formulir; pratinjau surat berubah langsung.',
  'Periksa bagian yang masih bertanda kurung siku.',
  'Pilih kertas A4 atau F4, lalu Unduh PDF atau Salin teks.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/buat-surat/${template.slug}`"
    :og-key="SLUG"
    :parent="{ name: 'Buat surat', path: '/buat-surat' }"
    :title="template.nama"
    :seo-title="template.seoTitle"
    :description="template.deskripsi"
    application-category="BusinessApplication"
    :faqs="template.faqs"
    :how-to="howTo"
    :checked-at="CHECKED_AT"
    :caveats="
      template.catatanHukum
        ? [
            'Template ini contoh umum, bukan nasihat hukum. Untuk urusan hukum penting, konsultasikan dengan notaris atau advokat.',
          ]
        : []
    "
    wide
  >
    <ClientOnly>
      <SuratGenerator :template="template" />
      <template #fallback>
        <p class="text-sm text-slate-600">Menyiapkan formulir...</p>
      </template>
    </ClientOnly>
    <AdSlot placement="result" :slug="SLUG" />
    <section class="card space-y-3">
      <h2 class="text-lg font-semibold">
        Struktur {{ template.nama.toLowerCase() }} yang baik
      </h2>
      <ol class="ml-5 list-decimal space-y-1 text-sm text-slate-700">
        <li v-for="item in template.struktur" :key="item">{{ item }}</li>
      </ol>
    </section>
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">
        Contoh {{ template.nama.toLowerCase() }}
      </h2>
      <SuratPreview :surat="contoh" />
    </section>
  </ToolShell>
</template>
