<script setup lang="ts">
import { downloadBlob, zipFiles } from '~/utils/browser-files';
import { formatBytes } from '~/utils/files';
import { renderPdfPages } from '~/utils/pdf-preview';

const SLUG = 'pdf-ke-jpg';
const events = useToolEvents(SLUG);
const pdf = usePdfFile();
const format = ref<'jpg' | 'png'>('jpg');
const dpi = ref(150);
const busy = ref(false);
const progress = ref('');
const results = ref<{ name: string; blob: Blob; size: string }[]>([]);

const pick = async (files: File[]) => {
  results.value = [];
  await pdf.pick(files);
};

const convert = async () => {
  if (!pdf.file.value) return;
  pdf.error.value = '';
  const pages = pdf.selectedPages();
  if (!pages) return;
  busy.value = true;
  results.value = [];
  events.calculate(`${format.value}-${dpi.value}`);
  try {
    const rendered = await renderPdfPages(await pdf.file.value.arrayBuffer(), {
      pages,
      dpi: dpi.value,
      type: format.value === 'png' ? 'image/png' : 'image/jpeg',
      quality: 0.9,
      onProgress: (done, total) => (progress.value = `${done}/${total}`),
    });
    results.value = rendered.map((page) => ({
      name: `${pdf.baseName.value}-hal-${page.index + 1}.${format.value}`,
      blob: page.blob,
      size: `${page.widthPx}×${page.heightPx}, ${formatBytes(page.blob.size)}`,
    }));
  } catch (caught) {
    pdf.error.value =
      caught instanceof Error ? caught.message : 'Gagal mengubah PDF.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
};

const downloadOne = (item: { name: string; blob: Blob }) => {
  downloadBlob(item.blob, item.name);
  events.download(format.value);
};
const downloadAll = async () => {
  downloadBlob(await zipFiles(results.value), `${pdf.baseName.value}.zip`);
  events.download('zip');
};

const faqs = [
  {
    q: 'Pilih 150 atau 300 dpi?',
    a: '150 dpi cukup untuk dilihat di layar dan dikirim lewat WhatsApp. Pilih 300 dpi untuk dicetak; file jadi sekitar empat kali lebih besar.',
  },
  {
    q: 'Apakah PDF saya diunggah?',
    a: 'Tidak. Halaman dirender oleh browser Anda sendiri; file tidak pernah dikirim ke server.',
  },
];
const howTo = [
  'Pilih satu file PDF.',
  'Pilih format (JPG atau PNG), resolusi, dan halaman yang mau diubah.',
  "Tekan 'Ubah ke gambar', lalu unduh per halaman atau semuanya sebagai ZIP.",
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="PDF ke JPG"
    seo-title="Ubah PDF ke JPG atau PNG Tanpa Upload"
    description="Ubah setiap halaman PDF menjadi gambar JPG atau PNG 150/300 dpi, langsung di browser tanpa upload. Unduh per halaman atau ZIP."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
  >
    <FileDropzone
      accept="application/pdf,.pdf"
      :multiple="false"
      label="Pilih satu file PDF"
      @files="pick"
    />
    <p v-if="pdf.error.value" class="text-sm text-rose-700">
      {{ pdf.error.value }}
    </p>
    <section v-if="pdf.file.value" class="card space-y-4">
      <p class="text-sm text-slate-600">
        {{ pdf.file.value.name }}: {{ pdf.pageCount.value }} halaman
      </p>
      <div class="flex flex-wrap gap-6">
        <fieldset class="space-y-1">
          <legend class="field-label">Format</legend>
          <label class="mr-4 text-sm"
            ><input v-model="format" type="radio" value="jpg" /> JPG</label
          >
          <label class="text-sm"
            ><input v-model="format" type="radio" value="png" /> PNG</label
          >
        </fieldset>
        <fieldset class="space-y-1">
          <legend class="field-label">Resolusi</legend>
          <label class="mr-4 text-sm"
            ><input v-model="dpi" type="radio" :value="150" /> 150 dpi
            (layar)</label
          >
          <label class="text-sm"
            ><input v-model="dpi" type="radio" :value="300" /> 300 dpi
            (cetak)</label
          >
        </fieldset>
      </div>
      <PageSelector
        v-model:semua="pdf.semua.value"
        v-model:ranges="pdf.ranges.value"
        :page-count="pdf.pageCount.value"
      />
      <button
        type="button"
        class="btn-primary"
        :disabled="busy"
        @click="convert"
      >
        Ubah ke gambar
      </button>
    </section>
    <BusyPanel
      v-if="busy"
      message="Merender halaman"
      :progress="progress"
      :slug="SLUG"
    />
    <section v-if="results.length && !busy" class="card space-y-4">
      <p class="font-semibold">{{ results.length }} gambar siap.</p>
      <ul class="divide-y divide-slate-100 text-sm">
        <li
          v-for="item in results"
          :key="item.name"
          class="flex items-center gap-3 py-2"
        >
          <span class="flex-1 truncate">{{ item.name }}</span>
          <span class="tabular text-slate-500">{{ item.size }}</span>
          <button type="button" class="btn-link" @click="downloadOne(item)">
            Unduh
          </button>
        </li>
      </ul>
      <button
        v-if="results.length > 1"
        type="button"
        class="btn-primary"
        @click="downloadAll"
      >
        Unduh semua (ZIP)
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
