<script setup lang="ts">
import type { FractionRect } from '~/utils/files/pdf-placement';
import { bersihkanTandaTangan } from '~/utils/files/signature';
import { bytesToBlob, downloadBlob } from '~/utils/browser-files';
import { renderPdfThumbnails } from '~/utils/pdf-preview';

const SLUG = 'tanda-tangan-pdf';
const events = useToolEvents(SLUG);
const pdf = usePdfFile();
const sumber = ref<'gambar-tangan' | 'unggah'>('gambar-tangan');
const tandaTangan = ref<{ blob: Blob; url: string; ratio: number } | null>(
  null,
);
const halaman = ref<{ url: string; ratio: number }[]>([]);
const aktif = ref(0);
interface Tempel {
  id: number;
  page: number;
  rect: FractionRect;
}
const tempelan = ref<Tempel[]>([]);
const terpilih = ref<number | null>(null);
const busy = ref(false);
const loading = ref(false);
const output = ref<Blob | null>(null);
let nextId = 1;

const revokeAll = () => {
  halaman.value.forEach((page) => URL.revokeObjectURL(page.url));
  if (tandaTangan.value) URL.revokeObjectURL(tandaTangan.value.url);
};
onBeforeUnmount(revokeAll);

const pick = async (files: File[]) => {
  output.value = null;
  tempelan.value = [];
  if (!(await pdf.pick(files))) return;
  loading.value = true;
  halaman.value.forEach((page) => URL.revokeObjectURL(page.url));
  const thumbs = await renderPdfThumbnails(
    await pdf.file.value!.arrayBuffer(),
    600,
  );
  halaman.value = await Promise.all(
    thumbs.map(
      (thumb) =>
        new Promise<{ url: string; ratio: number }>((resolve) => {
          const image = new Image();
          image.onload = () =>
            resolve({ url: thumb.url, ratio: image.width / image.height });
          image.onerror = () => resolve({ url: thumb.url, ratio: 0.707 });
          image.src = thumb.url;
        }),
    ),
  );
  aktif.value = 0;
  loading.value = false;
};

const simpanTandaTangan = async (
  source: CanvasImageSource & { width: number; height: number },
) => {
  pdf.error.value = '';
  try {
    const clean = await bersihkanTandaTangan(source);
    if (tandaTangan.value) URL.revokeObjectURL(tandaTangan.value.url);
    tandaTangan.value = {
      blob: clean.blob,
      url: URL.createObjectURL(clean.blob),
      ratio: clean.width / clean.height,
    };
  } catch (caught) {
    pdf.error.value = (caught as Error).message;
  }
};
const unggah = async (files: File[]) => {
  const file = files[0];
  if (!file) return;
  const bitmap = await createImageBitmap(file);
  await simpanTandaTangan(bitmap);
  bitmap.close();
};

const tempel = () => {
  const page = halaman.value[aktif.value];
  if (!page || !tandaTangan.value) return;
  const w = 0.3;
  // Height as a fraction of the page height keeps the signature's aspect.
  const h = (w * page.ratio) / tandaTangan.value.ratio;
  const id = nextId++;
  tempelan.value.push({
    id,
    page: aktif.value,
    rect: { x: 0.6, y: Math.min(0.8, 1 - h - 0.05), w, h },
  });
  terpilih.value = id;
  output.value = null;
};
const ubahUkuran = (item: Tempel, w: number) => {
  const page = halaman.value[item.page]!;
  const h = (w * page.ratio) / tandaTangan.value!.ratio;
  item.rect = {
    x: Math.min(item.rect.x, 1 - w),
    y: Math.min(item.rect.y, 1 - h),
    w,
    h,
  };
  output.value = null;
};
const hapus = (id: number) => {
  tempelan.value = tempelan.value.filter((item) => item.id !== id);
  output.value = null;
};

// Dragging inside the page preview, in fractions of its size.
const container = ref<HTMLElement | null>(null);
let drag: { item: Tempel; dx: number; dy: number } | null = null;
const startDrag = (event: PointerEvent, item: Tempel) => {
  const box = container.value!.getBoundingClientRect();
  drag = {
    item,
    dx: (event.clientX - box.left) / box.width - item.rect.x,
    dy: (event.clientY - box.top) / box.height - item.rect.y,
  };
  terpilih.value = item.id;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
};
const onDrag = (event: PointerEvent) => {
  if (!drag) return;
  const box = container.value!.getBoundingClientRect();
  const { rect } = drag.item;
  rect.x = Math.min(
    1 - rect.w,
    Math.max(0, (event.clientX - box.left) / box.width - drag.dx),
  );
  rect.y = Math.min(
    1 - rect.h,
    Math.max(0, (event.clientY - box.top) / box.height - drag.dy),
  );
  output.value = null;
};
const endDrag = () => (drag = null);

const pilihTerpilih = computed(() =>
  tempelan.value.find((item) => item.id === terpilih.value),
);

const simpan = async () => {
  if (!pdf.file.value || !tandaTangan.value || tempelan.value.length === 0)
    return;
  busy.value = true;
  pdf.error.value = '';
  events.calculate(sumber.value);
  try {
    const bytes = await pdf.file.value.arrayBuffer();
    const image = await tandaTangan.value.blob.arrayBuffer();
    const result = await usePdfWorker().call<Uint8Array>(
      'stamp',
      {
        bytes,
        image,
        placements: tempelan.value.map(({ page, rect }) => ({
          page,
          rect: { ...rect },
        })),
      },
      [bytes, image],
    );
    output.value = bytesToBlob(result, 'application/pdf');
  } catch (caught) {
    pdf.error.value =
      caught instanceof Error ? caught.message : 'Gagal menyimpan PDF.';
  } finally {
    busy.value = false;
  }
};
const download = () => {
  if (!output.value) return;
  downloadBlob(output.value, `${pdf.baseName.value}-ditandatangani.pdf`);
  events.download('pdf');
};

const faqs = [
  {
    q: 'Apakah tanda tangan ini sah secara hukum?',
    a: 'Ini gambar tanda tangan yang ditempel di PDF, bukan tanda tangan elektronik tersertifikasi. Untuk dokumen yang mensyaratkan tanda tangan elektronik tersertifikasi atau e-meterai, gunakan layanan Penyelenggara Sertifikasi Elektronik (PSrE) resmi.',
  },
  {
    q: 'Bisa memakai foto tanda tangan di kertas?',
    a: 'Bisa. Foto tanda tangan di kertas putih; latar putih dibuat transparan otomatis di browser Anda.',
  },
  {
    q: 'Apakah tanda tangan saya disimpan?',
    a: 'Tidak. Gambar tanda tangan dan PDF hanya ada di tab browser ini dan hilang saat halaman ditutup.',
  },
];
const howTo = [
  'Pilih file PDF.',
  'Gambar tanda tangan di kotak atau unggah foto tanda tangan.',
  "Pilih halaman, tekan 'Tempel di halaman ini', lalu geser dan atur ukurannya.",
  'Tekan Simpan PDF dan unduh.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Tanda Tangan PDF"
    seo-title="Tanda Tangan PDF Online Tanpa Upload (Gambar atau Foto)"
    description="Tempel tanda tangan ke PDF: gambar langsung di layar atau pakai foto tanda tangan, geser dan atur ukurannya. Diproses di browser, tidak diunggah."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    :caveats="[
      'Ini bukan tanda tangan elektronik tersertifikasi (PSrE) dan tidak menggantikan e-meterai.',
    ]"
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
    <p v-if="loading" class="text-sm text-slate-600">
      Menyiapkan pratinjau halaman...
    </p>
    <div v-if="pdf.file.value && !loading" class="grid gap-6 md:grid-cols-2">
      <section class="card space-y-3">
        <h2 class="font-semibold">1. Tanda tangan</h2>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-secondary"
            :aria-pressed="sumber === 'gambar-tangan'"
            @click="sumber = 'gambar-tangan'"
          >
            Gambar di layar
          </button>
          <button
            type="button"
            class="btn-secondary"
            :aria-pressed="sumber === 'unggah'"
            @click="sumber = 'unggah'"
          >
            Pakai foto
          </button>
        </div>
        <SignaturePad
          v-if="sumber === 'gambar-tangan'"
          @selesai="simpanTandaTangan"
        />
        <FileDropzone
          v-else
          accept="image/png,image/jpeg,.png,.jpg,.jpeg"
          :multiple="false"
          label="Pilih foto tanda tangan (kertas putih)"
          @files="unggah"
        />
        <div v-if="tandaTangan" class="rounded-lg border bg-slate-50 p-2">
          <img
            :src="tandaTangan.url"
            alt="Tanda tangan siap dipakai"
            class="mx-auto max-h-24"
          />
        </div>
        <template v-if="tandaTangan">
          <h2 class="font-semibold">2. Tempel</h2>
          <label for="tt-halaman" class="field-label">Halaman</label>
          <select id="tt-halaman" v-model.number="aktif" class="field-input">
            <option v-for="(_, index) in halaman" :key="index" :value="index">
              Halaman {{ index + 1 }}
            </option>
          </select>
          <button type="button" class="btn-secondary" @click="tempel">
            Tempel di halaman ini
          </button>
          <template v-if="pilihTerpilih">
            <label for="tt-ukuran" class="field-label">Ukuran</label>
            <input
              id="tt-ukuran"
              :value="pilihTerpilih.rect.w * 100"
              type="range"
              min="8"
              max="80"
              class="w-full"
              @input="
                ubahUkuran(
                  pilihTerpilih,
                  Number(($event.target as HTMLInputElement).value) / 100,
                )
              "
            />
            <button
              type="button"
              class="text-sm text-rose-700"
              @click="hapus(pilihTerpilih.id)"
            >
              Hapus tempelan ini
            </button>
          </template>
          <button
            type="button"
            class="btn-primary"
            :disabled="busy || tempelan.length === 0"
            @click="simpan"
          >
            Simpan PDF
          </button>
        </template>
      </section>
      <section v-if="halaman[aktif]" class="card">
        <p class="field-label">
          Pratinjau halaman {{ aktif + 1 }} (geser tanda tangan)
        </p>
        <div
          ref="container"
          class="relative mx-auto max-w-md touch-none select-none border"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <img
            :src="halaman[aktif].url"
            :alt="`Halaman ${aktif + 1}`"
            class="block w-full"
            draggable="false"
          />
          <img
            v-for="item in tempelan.filter((t) => t.page === aktif)"
            :key="item.id"
            :src="tandaTangan?.url"
            alt="Tanda tangan"
            draggable="false"
            class="absolute cursor-move"
            :class="
              item.id === terpilih ? 'outline outline-2 outline-teal-600' : ''
            "
            :style="{
              left: `${item.rect.x * 100}%`,
              top: `${item.rect.y * 100}%`,
              width: `${item.rect.w * 100}%`,
              height: `${item.rect.h * 100}%`,
            }"
            @pointerdown="startDrag($event, item)"
          />
        </div>
      </section>
    </div>
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
