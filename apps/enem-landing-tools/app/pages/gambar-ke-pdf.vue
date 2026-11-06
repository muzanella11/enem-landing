<script setup lang="ts">
import {
  bytesToBlob,
  downloadBlob,
  normalizeImage,
  preloadHeicDecoder,
} from '~/utils/browser-files';
import { formatBytes, type PaperSize } from '~/utils/files';

const SLUG = 'gambar-ke-pdf';
const events = useToolEvents(SLUG);
const { files, add, remove, move } = useFileList();
const paper = ref<PaperSize>('A4');
const marginMm = ref(10);
const busy = ref(false);
const progress = ref('');
const error = ref('');
const output = ref<Blob | null>(null);

onMounted(() => {
  usePdfWorker().warmUp();
  useImageWorker().warmUp();
  preloadHeicDecoder();
});
watch([files, paper, marginMm], () => (output.value = null), { deep: true });

const build = async () => {
  busy.value = true;
  error.value = '';
  events.calculate(paper.value);
  try {
    const images: { bytes: ArrayBuffer; kind: 'jpg' }[] = [];
    for (const [index, item] of files.value.entries()) {
      progress.value = `${index + 1} dari ${files.value.length}`;
      const normalized = await normalizeImage(item.file);
      // Re-encode every photo: applies the camera's rotation, strips EXIF/GPS,
      // and caps the size at roughly 300 dpi on F4 to keep the PDF small.
      const result = await useImageWorker().process(normalized.blob, {
        format: 'image/jpeg',
        quality: 0.85,
        maxWidth: 2600,
        maxHeight: 2600,
      });
      images.push({ bytes: await result.blob.arrayBuffer(), kind: 'jpg' });
    }
    progress.value = 'menyusun PDF';
    const bytes = await usePdfWorker().call<Uint8Array>(
      'imagesToPdf',
      { images, paper: paper.value, marginMm: marginMm.value },
      images.map((image) => image.bytes),
    );
    output.value = bytesToBlob(bytes, 'application/pdf');
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'Gagal membuat PDF.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
};

const download = () => {
  if (!output.value) return;
  downloadBlob(output.value, 'dokumen.pdf');
  events.download('pdf');
};

const faqs = [
  {
    q: 'Apa itu ukuran F4?',
    a: 'F4 (215 x 330 mm) adalah ukuran kertas folio yang banyak dipakai untuk dokumen di Indonesia. Pilih F4 bila instansi meminta ukuran folio.',
  },
  {
    q: 'Bisa memakai foto dari iPhone (HEIC)?',
    a: 'Bisa. Foto HEIC diubah ke JPG di browsermu sebelum disusun jadi PDF.',
  },
  {
    q: 'Apakah foto KTP atau KK saya aman?',
    a: 'Foto tidak pernah di-upload. Semua diproses di perangkatmu, dan metadata lokasi GPS dihapus.',
  },
];

const howTo = [
  'Pilih foto atau hasil scan (JPG, PNG, atau HEIC dari iPhone).',
  'Atur urutan gambar sesuai urutan halaman.',
  'Pilih ukuran kertas A4 atau F4 dan atur margin.',
  "Tekan 'Buat PDF' lalu unduh dokumen.",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Gambar ke PDF"
    seo-title="Ubah Foto Jadi PDF A4 atau F4"
    description="Gabungkan foto JPG, PNG, atau HEIC jadi satu PDF ukuran A4 atau F4 dengan margin yang bisa diatur. Tanpa upload."
    application-category="UtilitiesApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp,.avif"
      label="Pilih foto atau scan dokumen"
      @files="add"
    />
    <form
      v-if="files.length > 0"
      class="card space-y-4"
      @submit.prevent="build"
    >
      <FileList :files="files" reorderable @remove="remove" @move="move" />
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <span class="field-label">Ukuran kertas</span>
          <div class="seg" role="group" aria-label="Ukuran kertas">
            <button
              type="button"
              :aria-pressed="paper === 'A4'"
              @click="paper = 'A4'"
            >
              A4
            </button>
            <button
              type="button"
              :aria-pressed="paper === 'F4'"
              @click="paper = 'F4'"
            >
              F4 / Folio
            </button>
          </div>
        </div>
        <div>
          <label for="margin" class="field-label">Margin (mm)</label>
          <input
            id="margin"
            v-model.number="marginMm"
            type="number"
            min="0"
            max="50"
            class="field-input"
          />
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="busy">
        Buat PDF dari {{ files.length }} gambar
      </button>
      <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
    </form>
    <BusyPanel
      v-if="busy"
      message="Membuat PDF"
      :progress="progress"
      :slug="SLUG"
    />
    <section v-if="output && !busy" class="card space-y-4">
      <p class="font-semibold">PDF siap ({{ formatBytes(output.size) }}).</p>
      <button type="button" class="btn-primary" @click="download">
        Unduh dokumen.pdf
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
