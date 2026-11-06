<script setup lang="ts">
import type { WatermarkOptions } from '~/workers/pdf.worker';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { renderPdfThumbnails } from '~/utils/pdf-preview';

const SLUG = 'watermark-pdf';
const events = useToolEvents(SLUG);
const pdf = usePdfFile();
const jenis = ref<'teks' | 'gambar'>('teks');
const teks = ref('RAHASIA');
const ukuran = ref(10);
const opasitas = ref(25);
const sudut = ref(45);
const posisi = ref<'atas' | 'tengah' | 'bawah'>('tengah');
const warna = ref<'abu' | 'merah' | 'biru'>('abu');
const WARNA = {
  abu: { rgb: [0.4, 0.4, 0.4], css: '#666666' },
  merah: { rgb: [0.8, 0.1, 0.1], css: '#cc1a1a' },
  biru: { rgb: [0.1, 0.3, 0.8], css: '#1a4dcc' },
} as const;
const CY = { atas: 0.15, tengah: 0.5, bawah: 0.85 } as const;
const gambar = ref<File | null>(null);
const gambarUrl = ref('');
const lebarGambar = ref(40);
const preview = ref('');
const busy = ref(false);
const output = ref<Blob | null>(null);

const pick = async (files: File[]) => {
  output.value = null;
  if (!(await pdf.pick(files))) return;
  if (preview.value) URL.revokeObjectURL(preview.value);
  // Only the first page is rendered for the preview.
  const thumbs = await renderPdfThumbnails(
    await pdf.file.value!.arrayBuffer(),
    400,
    1,
  );
  preview.value = thumbs[0]?.url ?? '';
};
const pickImage = (files: File[]) => {
  gambar.value = files[0] ?? null;
  if (gambarUrl.value) URL.revokeObjectURL(gambarUrl.value);
  gambarUrl.value = gambar.value ? URL.createObjectURL(gambar.value) : '';
  output.value = null;
};
onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value);
  if (gambarUrl.value) URL.revokeObjectURL(gambarUrl.value);
});
watch(
  [jenis, teks, ukuran, opasitas, sudut, posisi, warna, lebarGambar],
  () => {
    output.value = null;
  },
);

const apply = async () => {
  if (!pdf.file.value) return;
  pdf.error.value = '';
  const pages = pdf.selectedPages();
  if (!pages) return;
  if (jenis.value === 'gambar' && !gambar.value) {
    pdf.error.value = 'Pilih gambar watermark dulu.';
    return;
  }
  busy.value = true;
  events.calculate(jenis.value);
  try {
    const bytes = await pdf.file.value.arrayBuffer();
    const transfer: ArrayBuffer[] = [bytes];
    const options: WatermarkOptions = {
      pages,
      sizeFraction: ukuran.value / 100,
      opacity: opasitas.value / 100,
      angle: sudut.value,
      cy: CY[posisi.value],
      color: [...WARNA[warna.value].rgb],
    };
    if (jenis.value === 'teks') options.text = teks.value;
    else {
      const imageBytes = await gambar.value!.arrayBuffer();
      transfer.push(imageBytes);
      options.image = {
        bytes: imageBytes,
        kind: /png$/i.test(gambar.value!.type) ? 'png' : 'jpg',
        widthFraction: lebarGambar.value / 100,
      };
    }
    const result = await usePdfWorker().call<Uint8Array>(
      'watermark',
      { bytes, options },
      transfer,
    );
    output.value = bytesToBlob(result, 'application/pdf');
  } catch (caught) {
    pdf.error.value =
      caught instanceof Error ? caught.message : 'Gagal menambah watermark.';
  } finally {
    busy.value = false;
  }
};
const download = () => {
  if (!output.value) return;
  downloadBlob(output.value, `${pdf.baseName.value}-watermark.pdf`);
  events.download('pdf');
};

const faqs = [
  {
    q: 'Apakah watermark bisa dihapus orang lain?',
    a: 'Watermark ditambahkan sebagai lapisan di atas isi halaman. Orang yang paham editor PDF masih bisa menghapusnya; untuk dokumen penting, gabungkan dengan mengubah PDF menjadi gambar (Kompres PDF mode kuat).',
  },
  {
    q: 'Huruf apa yang didukung?',
    a: 'Huruf Latin, angka, dan tanda baca umum. Karakter lain (mis. emoji) diganti tanda tanya.',
  },
];
const howTo = [
  'Pilih file PDF.',
  'Tulis teks watermark atau pilih gambar logo, lalu atur ukuran, transparansi, sudut, dan posisi.',
  'Pilih halaman, tekan Tambah watermark, lalu unduh.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Watermark PDF"
    seo-title="Tambah Watermark Teks atau Logo ke PDF Tanpa Upload"
    description="Tambahkan watermark teks (mis. RAHASIA, CONTOH, nama perusahaan) atau logo ke semua halaman PDF. Diproses di browser."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    wide
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
    <div v-if="pdf.file.value" class="grid gap-6 md:grid-cols-2">
      <section class="card space-y-3">
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary"
            :aria-pressed="jenis === 'teks'"
            @click="jenis = 'teks'"
          >
            Teks
          </button>
          <button
            type="button"
            class="btn-secondary"
            :aria-pressed="jenis === 'gambar'"
            @click="jenis = 'gambar'"
          >
            Gambar/logo
          </button>
        </div>
        <template v-if="jenis === 'teks'">
          <label for="wm-teks" class="field-label">Teks watermark</label>
          <input
            id="wm-teks"
            v-model="teks"
            maxlength="60"
            class="field-input"
          />
          <label for="wm-ukuran" class="field-label"
            >Ukuran huruf ({{ ukuran }}% lebar halaman)</label
          >
          <input
            id="wm-ukuran"
            v-model.number="ukuran"
            type="range"
            min="3"
            max="25"
            class="w-full"
          />
          <label for="wm-sudut" class="field-label">Sudut</label>
          <select id="wm-sudut" v-model.number="sudut" class="field-input">
            <option :value="0">Mendatar</option>
            <option :value="45">Miring naik (45°)</option>
            <option :value="-45">Miring turun (-45°)</option>
            <option :value="90">Tegak</option>
          </select>
          <label for="wm-warna" class="field-label">Warna</label>
          <select id="wm-warna" v-model="warna" class="field-input">
            <option value="abu">Abu-abu</option>
            <option value="merah">Merah</option>
            <option value="biru">Biru</option>
          </select>
        </template>
        <template v-else>
          <FileDropzone
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            :multiple="false"
            label="Pilih gambar PNG/JPG"
            @files="pickImage"
          />
          <label for="wm-lebar" class="field-label"
            >Lebar ({{ lebarGambar }}% halaman)</label
          >
          <input
            id="wm-lebar"
            v-model.number="lebarGambar"
            type="range"
            min="10"
            max="90"
            class="w-full"
          />
        </template>
        <label for="wm-opasitas" class="field-label"
          >Transparansi ({{ opasitas }}% terlihat)</label
        >
        <input
          id="wm-opasitas"
          v-model.number="opasitas"
          type="range"
          min="5"
          max="100"
          class="w-full"
        />
        <label for="wm-posisi" class="field-label">Posisi</label>
        <select id="wm-posisi" v-model="posisi" class="field-input">
          <option value="atas">Atas</option>
          <option value="tengah">Tengah</option>
          <option value="bawah">Bawah</option>
        </select>
        <PageSelector
          v-model:semua="pdf.semua.value"
          v-model:ranges="pdf.ranges.value"
          :page-count="pdf.pageCount.value"
        />
        <button
          type="button"
          class="btn-primary"
          :disabled="busy"
          @click="apply"
        >
          Tambah watermark
        </button>
      </section>
      <section v-if="preview" class="card">
        <p class="field-label">Pratinjau halaman 1</p>
        <div
          class="wm-preview relative mx-auto max-w-sm overflow-hidden border"
        >
          <img :src="preview" alt="Pratinjau halaman 1" class="block w-full" />
          <div
            class="pointer-events-none absolute inset-x-0 flex justify-center"
            :style="{ top: `${CY[posisi] * 100}%` }"
          >
            <span
              v-if="jenis === 'teks'"
              class="whitespace-nowrap font-bold"
              :style="{
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: `${ukuran}cqw`,
                color: WARNA[warna].css,
                opacity: opasitas / 100,
                transform: `translateY(-50%) rotate(${-sudut}deg)`,
              }"
              >{{ teks }}</span
            >
            <img
              v-else-if="gambarUrl"
              :src="gambarUrl"
              alt=""
              :style="{
                width: `${lebarGambar}%`,
                opacity: opasitas / 100,
                transform: 'translateY(-50%)',
              }"
            />
          </div>
        </div>
      </section>
    </div>
    <BusyPanel v-if="busy" message="Menambah watermark" :slug="SLUG" />
    <section v-if="output && !busy" class="card space-y-4">
      <button type="button" class="btn-primary" @click="download">
        Unduh PDF
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>

<style scoped>
.wm-preview {
  container-type: inline-size;
}
</style>
