<script setup lang="ts">
import { formatBytes } from '~/utils/files';

const SLUG = 'kompres-gambar';
const { files, add, remove, move, totalBytes, overSoftLimit } = useFileList();
const batch = useImageBatch(SLUG);

const mode = ref<'target' | 'kualitas'>('target');
const targetKb = ref(200);
const quality = ref(75);
const format = ref<'image/jpeg' | 'image/webp'>('image/jpeg');
const maxWidth = ref(0);

const compress = () =>
  batch.run(
    files.value,
    () => ({
      format: format.value,
      quality: mode.value === 'kualitas' ? quality.value / 100 : 0.92,
      targetBytes: mode.value === 'target' ? targetKb.value * 1024 : undefined,
      maxWidth: maxWidth.value || undefined,
      maxHeight: maxWidth.value || undefined,
    }),
    mode.value,
  );

const faqs = [
  {
    q: 'Bagaimana mengecilkan foto di bawah 200 KB untuk pendaftaran?',
    a: 'Pilih mode "Target ukuran", isi 200 KB, lalu kompres. Tool menurunkan kualitas secara bertahap, dan bila perlu memperkecil dimensi, sampai ukuran file di bawah target.',
  },
  {
    q: 'Apakah foto saya di-upload?',
    a: 'Tidak. Kompresi berjalan di browsermu, jadi foto KTP, ijazah, atau dokumen pribadi lain tetap di perangkatmu.',
  },
  {
    q: 'Apakah lokasi GPS di foto ikut terhapus?',
    a: 'Ya. Hasil kompresi dibuat ulang tanpa metadata EXIF, termasuk lokasi GPS.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kompres Gambar"
    seo-title="Kompres Foto Jadi di Bawah 200 KB Tanpa Upload"
    description="Perkecil ukuran foto sampai target (mis. di bawah 200 KB untuk formulir pendaftaran CPNS atau kerja), banyak file sekaligus, unduh ZIP. Tanpa upload."
    application-category="MultimediaApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
      label="Pilih foto (JPG, PNG, WebP, HEIC)"
      @files="add"
    />
    <form
      v-if="files.length > 0"
      class="card space-y-4"
      @submit.prevent="compress"
    >
      <FileList :files="files" @remove="remove" @move="move" />
      <p class="text-sm text-slate-600">Total {{ formatBytes(totalBytes) }}.</p>
      <p
        v-if="overSoftLimit"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        Total file cukup besar untuk perangkat ini; proses bisa lambat.
      </p>
      <div class="seg" role="group" aria-label="Mode kompresi">
        <button
          type="button"
          :aria-pressed="mode === 'target'"
          @click="mode = 'target'"
        >
          Target ukuran
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'kualitas'"
          @click="mode = 'kualitas'"
        >
          Atur kualitas
        </button>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div v-if="mode === 'target'">
          <label for="target" class="field-label">Ukuran maksimal (KB)</label>
          <input
            id="target"
            v-model.number="targetKb"
            type="number"
            min="10"
            step="10"
            class="field-input"
          />
        </div>
        <div v-else>
          <label for="kualitas" class="field-label"
            >Kualitas: {{ quality }}%</label
          >
          <input
            id="kualitas"
            v-model.number="quality"
            type="range"
            min="10"
            max="95"
            class="w-full accent-teal-700"
          />
        </div>
        <div>
          <label for="format" class="field-label">Format hasil</label>
          <select id="format" v-model="format" class="field-input">
            <option value="image/jpeg">JPG (paling kompatibel)</option>
            <option value="image/webp">WebP (lebih kecil)</option>
          </select>
        </div>
        <div>
          <label for="max-width" class="field-label"
            >Sisi terpanjang maks. (px)</label
          >
          <input
            id="max-width"
            v-model.number="maxWidth"
            type="number"
            min="0"
            step="100"
            class="field-input"
            placeholder="0 = tidak dibatasi"
          />
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="batch.busy.value">
        Kompres {{ files.length }} foto
      </button>
    </form>
    <BusyPanel
      v-if="batch.busy.value"
      message="Mengompres foto"
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
      zip-name="foto-terkompres.zip"
      :target-bytes="mode === 'target' ? targetKb * 1024 : undefined"
      @one="batch.downloadOne"
      @all="batch.downloadAll('foto-terkompres.zip')"
    />
  </ToolShell>
</template>
