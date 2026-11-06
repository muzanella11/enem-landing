<script setup lang="ts">
import { WIDGET } from '~/data/distribusi';

const { public: pub } = useRuntimeConfig();
const siteUrl = (pub as { siteUrl: string }).siteUrl;
const pilih = ref<(typeof WIDGET)[number]['slug']>(WIDGET[0].slug);
const widget = computed(() => WIDGET.find((w) => w.slug === pilih.value)!);
const kode = computed(
  () =>
    `<iframe src="${siteUrl}/embed/${widget.value.slug}" title="${widget.value.label} - tools.muzanella.com" width="100%" height="${widget.value.tinggi}" style="border:0;max-width:720px" loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"></iframe>`,
);
const disalin = ref(false);
const salin = async () => {
  await navigator.clipboard.writeText(kode.value);
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
};
usePageSeo({
  title: 'Pasang Kalkulator di Situsmu (Widget Gratis)',
  description:
    'Pasang kalkulator gaji bersih, THR, atau zakat di blog atau situs kantor dengan satu kode iframe. Gratis, tanpa iklan di dalam widget.',
  path: '/pasang-widget',
  ogKey: 'default',
});
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 px-4 py-10">
    <h1 class="text-2xl font-bold">Pasang Kalkulator di Situsmu</h1>
    <p class="text-slate-600">
      Gratis untuk blog, situs kantor, atau sekolah. Widget tidak memuat iklan
      dan tidak melacak pengunjung situsmu; semua hitungan berjalan di perangkat
      pengunjung. Mohon biarkan tautan "Dibuat oleh tools.muzanella.com" tetap
      tampil.
    </p>
    <section class="card space-y-3">
      <label for="widget-pilih" class="field-label">Kalkulator</label>
      <select id="widget-pilih" v-model="pilih" class="field-input">
        <option v-for="w in WIDGET" :key="w.slug" :value="w.slug">
          {{ w.label }}
        </option>
      </select>
      <label for="widget-kode" class="field-label">Kode untuk ditempel</label>
      <textarea
        id="widget-kode"
        :value="kode"
        readonly
        rows="4"
        class="field-input font-mono text-xs"
      />
      <button type="button" class="btn-primary" @click="salin">
        {{ disalin ? 'Tersalin' : 'Salin kode' }}
      </button>
    </section>
    <section class="card">
      <p class="field-label">Pratinjau</p>
      <iframe
        :src="`/embed/${widget.slug}`"
        :title="`Pratinjau ${widget.label}`"
        class="h-[600px] w-full rounded border"
      />
    </section>
  </div>
</template>
