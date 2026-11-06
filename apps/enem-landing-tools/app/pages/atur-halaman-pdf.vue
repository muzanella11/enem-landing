<script setup lang="ts">
import { renderPdfThumbnails } from '~/utils/pdf-preview';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';

const SLUG = 'atur-halaman-pdf';
const events = useToolEvents(SLUG);

interface PageItem {
  key: string;
  index: number;
  rotation: number;
  thumb: string;
}

const file = ref<File | null>(null);
const pages = ref<PageItem[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const output = ref<Blob | null>(null);
let thumbUrls: string[] = [];

onMounted(() => usePdfWorker().warmUp());
onBeforeUnmount(() => thumbUrls.forEach((url) => URL.revokeObjectURL(url)));

const pick = async (files: File[]) => {
  const picked = files[0];
  if (!picked) return;
  file.value = picked;
  output.value = null;
  error.value = '';
  loading.value = true;
  thumbUrls.forEach((url) => URL.revokeObjectURL(url));
  try {
    const thumbs = await renderPdfThumbnails(await picked.arrayBuffer());
    thumbUrls = thumbs.map((thumb) => thumb.url);
    pages.value = thumbs.map((thumb, index) => ({
      key: `${index}`,
      index,
      rotation: 0,
      thumb: thumb.url,
    }));
  } catch {
    error.value =
      'PDF tidak bisa dibuka. Pastikan file tidak rusak atau terkunci kata sandi.';
    file.value = null;
  } finally {
    loading.value = false;
  }
};

const rotate = (position: number) => {
  const page = pages.value[position];
  if (page) page.rotation = (page.rotation + 90) % 360;
  output.value = null;
};
const removePage = (position: number) => {
  pages.value.splice(position, 1);
  output.value = null;
};
const movePage = (from: number, to: number) => {
  if (to < 0 || to >= pages.value.length) return;
  const [page] = pages.value.splice(from, 1);
  if (page) pages.value.splice(to, 0, page);
  output.value = null;
};
const dragFrom = ref<number | null>(null);

const save = async () => {
  if (!file.value || pages.value.length === 0) return;
  busy.value = true;
  error.value = '';
  events.calculate();
  try {
    const bytes = await file.value.arrayBuffer();
    const result = await usePdfWorker().call<Uint8Array>(
      'arrange',
      {
        bytes,
        pages: pages.value.map((page) => ({
          index: page.index,
          rotation: page.rotation,
        })),
      },
      [bytes],
    );
    output.value = bytesToBlob(result, 'application/pdf');
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : 'Gagal menyimpan PDF.';
  } finally {
    busy.value = false;
  }
};

const download = () => {
  if (!output.value || !file.value) return;
  downloadBlob(
    output.value,
    file.value.name.replace(/\.pdf$/i, '') + '-diatur.pdf',
  );
  events.download('pdf');
};

const faqs = [
  {
    q: 'Bisa memutar hanya satu halaman?',
    a: 'Bisa. Tekan tombol putar di halaman itu; setiap tekan memutar 90 derajat searah jarum jam.',
  },
  {
    q: 'Apakah kualitas PDF berubah?',
    a: 'Tidak. Halaman disalin apa adanya, hanya urutan dan rotasinya yang berubah. Thumbnail hanya pratinjau.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Atur Halaman PDF"
    seo-title="Urutkan, Putar, dan Hapus Halaman PDF"
    description="Urutkan ulang, putar, dan hapus halaman PDF dengan pratinjau thumbnail, langsung di browser tanpa upload."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    wide
  >
    <FileDropzone
      accept="application/pdf,.pdf"
      :multiple="false"
      label="Pilih satu file PDF"
      @files="pick"
    />
    <p v-if="loading" class="text-sm text-slate-600">
      Menyiapkan pratinjau halaman...
    </p>
    <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>

    <section v-if="pages.length > 0" class="card space-y-4">
      <p class="text-sm text-slate-600">
        {{ pages.length }} halaman. Seret untuk mengurutkan.
      </p>
      <ol class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <li
          v-for="(page, position) in pages"
          :key="page.key"
          class="rounded-xl border border-slate-200 bg-slate-50 p-2"
          draggable="true"
          @dragstart="dragFrom = position"
          @dragover.prevent
          @drop.prevent="
            dragFrom !== null && movePage(dragFrom, position);
            dragFrom = null;
          "
        >
          <div
            class="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-white"
          >
            <img
              :src="page.thumb"
              :alt="`Halaman ${page.index + 1}`"
              class="max-h-full max-w-full transition-transform"
              :style="{ transform: `rotate(${page.rotation}deg)` }"
            />
          </div>
          <p class="mt-1 text-center text-xs text-slate-600">
            Hal. {{ page.index + 1 }}
          </p>
          <div class="mt-1 flex justify-center gap-1 text-sm">
            <button
              type="button"
              class="btn-link px-1"
              :aria-label="`Geser halaman ${page.index + 1} ke kiri`"
              :disabled="position === 0"
              @click="movePage(position, position - 1)"
            >
              ←
            </button>
            <button
              type="button"
              class="btn-link px-1"
              :aria-label="`Putar halaman ${page.index + 1}`"
              @click="rotate(position)"
            >
              ⟳
            </button>
            <button
              type="button"
              class="px-1 text-rose-700"
              :aria-label="`Hapus halaman ${page.index + 1}`"
              @click="removePage(position)"
            >
              ✕
            </button>
            <button
              type="button"
              class="btn-link px-1"
              :aria-label="`Geser halaman ${page.index + 1} ke kanan`"
              :disabled="position === pages.length - 1"
              @click="movePage(position, position + 1)"
            >
              →
            </button>
          </div>
        </li>
      </ol>
      <button type="button" class="btn-primary" :disabled="busy" @click="save">
        Simpan PDF
      </button>
    </section>

    <BusyPanel v-if="busy" message="Menyimpan PDF" :slug="SLUG" />
    <section v-if="output && !busy" class="card space-y-4">
      <button type="button" class="btn-primary" @click="download">
        Unduh PDF
      </button>
      <DonationCta placement="after-download" :slug="SLUG" />
      <AdSlot placement="result" :slug="SLUG" />
    </section>
  </ToolShell>
</template>
