<script setup lang="ts">
import { bytesToBlob, downloadBlob, zipFiles } from '~/utils/browser-files';
import { parsePageRanges } from '~/utils/files';

const SLUG = 'pisah-pdf';
const events = useToolEvents(SLUG);
const file = ref<File | null>(null);
const pageCount = ref(0);
const ranges = ref('');
const output = ref<'separate' | 'single'>('separate');
const busy = ref(false);
const error = ref('');
const results = ref<{ name: string; blob: Blob }[]>([]);

onMounted(() => usePdfWorker().warmUp());

const pick = async (files: File[]) => {
  const picked = files[0];
  if (!picked) return;
  file.value = picked;
  results.value = [];
  error.value = '';
  try {
    const bytes = await picked.arrayBuffer();
    const info = await usePdfWorker().call<{ pageCount: number }>(
      'info',
      { bytes },
      [bytes],
    );
    pageCount.value = info.pageCount;
    ranges.value = `1-${info.pageCount}`;
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'PDF tidak bisa dibaca.';
    file.value = null;
  }
};

const baseName = computed(
  () => file.value?.name.replace(/\.pdf$/i, '') ?? 'dokumen',
);

const split = async () => {
  if (!file.value) return;
  error.value = '';
  let groups: number[][];
  try {
    groups = parsePageRanges(ranges.value, pageCount.value);
  } catch (caught) {
    error.value = (caught as Error).message;
    return;
  }
  if (output.value === 'single') groups = [groups.flat()];
  busy.value = true;
  events.calculate(output.value);
  try {
    const bytes = await file.value.arrayBuffer();
    const parts = await usePdfWorker().call<Uint8Array[]>(
      'extract',
      { bytes, groups },
      [bytes],
    );
    const labels = ranges.value
      .split(/[,;]/)
      .map((part) => part.trim().replace(/\s+/g, ''))
      .filter(Boolean);
    results.value = parts.map((part, index) => ({
      name:
        output.value === 'single'
          ? `${baseName.value}-halaman-terpilih.pdf`
          : `${baseName.value}-hal-${labels[index] ?? index + 1}.pdf`,
      blob: bytesToBlob(part, 'application/pdf'),
    }));
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'Gagal memisah PDF.';
  } finally {
    busy.value = false;
  }
};

const downloadAll = async () => {
  if (results.value.length === 1) {
    downloadBlob(results.value[0]!.blob, results.value[0]!.name);
  } else {
    downloadBlob(
      await zipFiles(results.value),
      `${baseName.value}-dipisah.zip`,
    );
  }
  events.download(results.value.length === 1 ? 'pdf' : 'zip');
};

const faqs = [
  {
    q: 'Bagaimana menulis halaman yang mau diambil?',
    a: 'Pisahkan dengan koma. Contoh: 1-3, 5, 8-10 akan menghasilkan tiga file (halaman 1 sampai 3, halaman 5, halaman 8 sampai 10), atau satu file berisi semuanya bila memilih "satu file".',
  },
  {
    q: 'Apakah PDF saya dikirim ke server?',
    a: 'Tidak. Semua proses terjadi di browsermu.',
  },
];

const howTo = [
  'Pilih satu file PDF.',
  'Tulis halaman yang ingin diambil, misalnya 1-3, 5, 8-10.',
  'Pilih apakah hasilnya satu file per rentang atau digabung jadi satu file.',
  "Tekan 'Pisahkan' lalu unduh hasilnya (beberapa file diunduh sekaligus sebagai ZIP).",
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Pisah PDF"
    seo-title="Pisah PDF dan Ambil Halaman Tertentu"
    description="Ambil halaman atau rentang halaman tertentu dari PDF, simpan per file atau jadi satu. Diproses di browser, tanpa upload."
    application-category="UtilitiesApplication"
    :faqs="faqs"
  >
    <FileDropzone
      accept="application/pdf,.pdf"
      :multiple="false"
      label="Pilih satu file PDF"
      @files="pick"
    />
    <form
      v-if="file && pageCount > 0"
      class="card space-y-4"
      @submit.prevent="split"
    >
      <p class="text-sm">
        <strong>{{ file.name }}</strong> · {{ pageCount }} halaman
      </p>
      <div>
        <label for="ranges" class="field-label">Halaman yang diambil</label>
        <input
          id="ranges"
          v-model="ranges"
          type="text"
          class="field-input"
          placeholder="1-3, 5, 8-10"
        />
        <p class="field-hint">
          Pisahkan dengan koma. Rentang pakai tanda minus.
        </p>
      </div>
      <div class="seg" role="group" aria-label="Bentuk hasil">
        <button
          type="button"
          :aria-pressed="output === 'separate'"
          @click="output = 'separate'"
        >
          Satu file per rentang
        </button>
        <button
          type="button"
          :aria-pressed="output === 'single'"
          @click="output = 'single'"
        >
          Gabung jadi satu file
        </button>
      </div>
      <div>
        <button type="submit" class="btn-primary" :disabled="busy">
          Pisahkan
        </button>
      </div>
    </form>
    <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
    <BusyPanel v-if="busy" message="Memisahkan halaman" :slug="SLUG" />
    <section v-if="results.length > 0 && !busy" class="card space-y-4">
      <p class="font-semibold">{{ results.length }} file siap.</p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="result in results"
          :key="result.name"
          class="flex items-center justify-between gap-3"
        >
          <span class="truncate">{{ result.name }}</span>
          <button
            type="button"
            class="btn-link"
            @click="downloadBlob(result.blob, result.name)"
          >
            Unduh
          </button>
        </li>
      </ul>
      <button type="button" class="btn-primary" @click="downloadAll">
        {{ results.length > 1 ? 'Unduh semua (ZIP)' : 'Unduh' }}
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
