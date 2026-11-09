<script setup lang="ts">
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { formatBytes } from '~/utils/files';
import { LANGKAH_KOMPRES } from '~/utils/files/pdf-placement';
import { renderPdfPages } from '~/utils/pdf-preview';

const SLUG = 'kompres-pdf';
const events = useToolEvents(SLUG);
const pdf = usePdfFile();
const mode = ref<'ringan' | 'kuat'>('ringan');
const target = ref<'kualitas' | 'ukuran'>('kualitas');
const kualitas = ref<'sedang' | 'kecil'>('sedang');
const targetMb = ref(1);
const busy = ref(false);
const progress = ref('');
const output = ref<Blob | null>(null);
const catatan = ref('');

const pick = async (files: File[]) => {
  output.value = null;
  catatan.value = '';
  await pdf.pick(files);
};

const raster = async (dpi: number, quality: number) => {
  const pages = await renderPdfPages(await pdf.file.value!.arrayBuffer(), {
    dpi,
    type: 'image/jpeg',
    quality,
    onProgress: (done, total) =>
      (progress.value = `${dpi} dpi, halaman ${done}/${total}`),
  });
  const images = await Promise.all(
    pages.map(async (page) => ({
      bytes: await page.blob.arrayBuffer(),
      widthPt: page.widthPt,
      heightPt: page.heightPt,
    })),
  );
  const bytes = await usePdfWorker().call<Uint8Array>(
    'rasterToPdf',
    { images },
    images.map((image) => image.bytes),
  );
  return bytesToBlob(bytes, 'application/pdf');
};

const compress = async () => {
  if (!pdf.file.value) return;
  busy.value = true;
  output.value = null;
  catatan.value = '';
  pdf.error.value = '';
  events.calculate(mode.value === 'ringan' ? 'ringan' : target.value);
  try {
    let result: Blob;
    if (mode.value === 'ringan') {
      const bytes = await pdf.file.value.arrayBuffer();
      result = bytesToBlob(
        await usePdfWorker().call<Uint8Array>('compressLight', { bytes }, [
          bytes,
        ]),
        'application/pdf',
      );
    } else if (target.value === 'kualitas') {
      const step =
        kualitas.value === 'sedang' ? LANGKAH_KOMPRES[0] : LANGKAH_KOMPRES[3];
      result = await raster(step.dpi, step.quality);
    } else {
      const limit = targetMb.value * 1024 * 1024;
      result = await raster(LANGKAH_KOMPRES[0].dpi, LANGKAH_KOMPRES[0].quality);
      for (const step of LANGKAH_KOMPRES.slice(1)) {
        if (result.size <= limit) break;
        result = await raster(step.dpi, step.quality);
      }
      if (result.size > limit) {
        catatan.value = `Ukuran terkecil yang bisa dicapai ${formatBytes(result.size)}. Coba pisah PDF menjadi beberapa file.`;
      }
    }
    if (result.size >= pdf.file.value.size) {
      catatan.value =
        mode.value === 'ringan'
          ? 'PDF ini sudah ringkas; mode ringan tidak bisa mengecilkannya lagi. Coba mode kuat bila isinya hasil scan.'
          : 'Hasilnya tidak lebih kecil dari file asli. PDF ini kemungkinan berisi teks, bukan hasil scan; pakai mode ringan saja.';
    }
    output.value = result;
  } catch (caught) {
    pdf.error.value =
      caught instanceof Error ? caught.message : 'Gagal mengompres PDF.';
  } finally {
    busy.value = false;
    progress.value = '';
  }
};

const download = () => {
  if (!output.value) return;
  downloadBlob(output.value, `${pdf.baseName.value}-kompres.pdf`);
  events.download('pdf');
};

const faqs = [
  {
    q: 'Kenapa teks tidak bisa dipilih setelah kompres kuat?',
    a: 'Mode kuat menggambar ulang setiap halaman menjadi gambar JPEG lalu menyusunnya kembali menjadi PDF. Ukurannya turun jauh, tetapi teks berubah menjadi gambar sehingga tidak bisa dipilih atau dicari.',
  },
  {
    q: 'Mode mana yang cocok untuk hasil scan?',
    a: 'Mode kuat. PDF hasil scan isinya memang gambar, jadi turunnya bisa besar. Untuk PDF berisi teks (dari Word), mode ringan biasanya cukup.',
  },
  {
    q: 'Apakah file saya diunggah?',
    a: 'Tidak. Semua proses berjalan di browser Anda.',
  },
];
const howTo = [
  'Pilih satu file PDF.',
  'Pilih mode ringan (teks tetap bisa dipilih) atau kuat (untuk hasil scan).',
  'Pada mode kuat, pilih kualitas atau target ukuran, mis. di bawah 1 MB.',
  'Tekan Kompres PDF lalu unduh hasilnya.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kompres PDF"
    seo-title="Kompres PDF Online Tanpa Upload, Bisa Target di Bawah 1 MB"
    description="Kecilkan ukuran PDF hasil scan untuk syarat upload lamaran, CPNS, atau beasiswa. Diproses di browser, file tidak diunggah."
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
        {{ pdf.file.value.name }}: {{ pdf.pageCount.value }} halaman,
        {{ formatBytes(pdf.file.value.size) }}
      </p>
      <fieldset class="space-y-2">
        <legend class="field-label">Mode</legend>
        <label class="flex gap-2 text-sm">
          <input v-model="mode" type="radio" value="ringan" />
          <span
            ><strong>Ringan</strong>: simpan ulang lebih ringkas, teks tetap
            bisa dipilih.</span
          >
        </label>
        <label class="flex gap-2 text-sm">
          <input v-model="mode" type="radio" value="kuat" />
          <span
            ><strong>Kuat</strong>: halaman diubah jadi gambar JPEG. Ukuran
            turun jauh, tetapi teks tidak bisa dipilih lagi.</span
          >
        </label>
      </fieldset>
      <template v-if="mode === 'kuat'">
        <fieldset class="space-y-2">
          <legend class="field-label">Atur berdasarkan</legend>
          <label class="mr-4 text-sm"
            ><input v-model="target" type="radio" value="kualitas" />
            Kualitas</label
          >
          <label class="text-sm"
            ><input v-model="target" type="radio" value="ukuran" /> Target
            ukuran</label
          >
        </fieldset>
        <div v-if="target === 'kualitas'" class="flex gap-4 text-sm">
          <label
            ><input v-model="kualitas" type="radio" value="sedang" /> Sedang
            (150 dpi)</label
          >
          <label
            ><input v-model="kualitas" type="radio" value="kecil" /> Kecil (96
            dpi)</label
          >
        </div>
        <div v-else>
          <label for="target-mb" class="field-label"
            >Maksimal ukuran (MB)</label
          >
          <input
            id="target-mb"
            v-model.number="targetMb"
            type="number"
            min="0.1"
            step="0.1"
            class="field-input"
          />
        </div>
      </template>
      <button
        type="button"
        class="btn-primary"
        :disabled="busy"
        @click="compress"
      >
        Kompres PDF
      </button>
    </section>
    <BusyPanel
      v-if="busy"
      message="Mengompres PDF"
      :progress="progress"
      :slug="SLUG"
    />
    <section v-if="output && !busy && pdf.file.value" class="card space-y-4">
      <p class="tabular text-lg" aria-live="polite">
        {{ formatBytes(pdf.file.value.size) }} →
        <strong>{{ formatBytes(output.size) }}</strong>
        <span v-if="output.size < pdf.file.value.size" class="text-primary">
          (-{{ Math.round((1 - output.size / pdf.file.value.size) * 100) }}%)
        </span>
      </p>
      <p v-if="catatan" class="text-sm text-amber-800">{{ catatan }}</p>
      <button type="button" class="btn-primary" @click="download">
        Unduh PDF
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
