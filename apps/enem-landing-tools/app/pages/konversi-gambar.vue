<script setup lang="ts">
import type { OutputFormat } from '~/workers/image.worker';

const SLUG = 'konversi-gambar';
const { files, add, remove, move } = useFileList();
const batch = useImageBatch(SLUG);
const format = ref<OutputFormat>('image/jpeg');
const quality = ref(90);

const convert = () =>
  batch.run(
    files.value,
    () => ({ format: format.value, quality: quality.value / 100 }),
    format.value.split('/')[1],
  );

const faqs = [
  {
    q: 'Bagaimana mengubah foto HEIC dari iPhone ke JPG?',
    a: 'Pilih foto HEIC, pilih format hasil JPG, lalu tekan Konversi. Konversi berjalan di browsermu, jadi foto tidak dikirim ke mana pun.',
  },
  {
    q: 'Format apa saja yang didukung?',
    a: 'Masukan: JPG, PNG, WebP, AVIF (bila browsermu mendukung), dan HEIC/HEIF. Hasil: JPG, PNG, atau WebP.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Konversi Gambar"
    seo-title="Konversi HEIC ke JPG, PNG, dan WebP Tanpa Upload"
    description="Ubah format gambar JPG, PNG, WebP, AVIF, dan HEIC dari iPhone ke JPG, PNG, atau WebP, langsung di browser."
    application-category="MultimediaApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
      label="Pilih gambar (termasuk HEIC dari iPhone)"
      @files="add"
    />
    <form
      v-if="files.length > 0"
      class="card space-y-4"
      @submit.prevent="convert"
    >
      <FileList :files="files" @remove="remove" @move="move" />
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="format" class="field-label">Format hasil</label>
          <select id="format" v-model="format" class="field-input">
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>
        <div v-if="format !== 'image/png'">
          <label for="kualitas" class="field-label"
            >Kualitas: {{ quality }}%</label
          >
          <input
            id="kualitas"
            v-model.number="quality"
            type="range"
            min="40"
            max="100"
            class="w-full accent-teal-700"
          />
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="batch.busy.value">
        Konversi {{ files.length }} gambar
      </button>
    </form>
    <BusyPanel
      v-if="batch.busy.value"
      message="Mengonversi"
      :progress="batch.progress.value"
      :slug="SLUG"
    />
    <ImageResults
      v-else-if="
        batch.results.value.length > 0 || batch.failures.value.length > 0
      "
      :slug="SLUG"
      :results="batch.results.value"
      :failures="batch.failures.value"
      zip-name="gambar-dikonversi.zip"
      @one="batch.downloadOne"
      @all="batch.downloadAll('gambar-dikonversi.zip')"
    />
  </ToolShell>
</template>
