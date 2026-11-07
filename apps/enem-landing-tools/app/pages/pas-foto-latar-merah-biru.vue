<script setup lang="ts">
import { LISENSI_MODEL, WARNA_LATAR } from '~/data/latar';
import { downloadBlob } from '~/utils/browser-files';
import { cmToPx, PAS_FOTO_CM, type PasFotoSize } from '~/utils/files';
import {
  cropPasFoto,
  KERTAS_CETAK,
  kotakOrang,
  tataLembar,
  type KertasCetak,
} from '~/utils/files/latar';

const SLUG = 'pas-foto-latar-merah-biru';
const events = useToolEvents(SLUG);
const editor = ref<{
  hasil: () => HTMLCanvasElement | null;
  mask: () => { mask: Uint8ClampedArray; lebar: number; tinggi: number } | null;
} | null>(null);
const warna = ref<string>('merah');
const ukuran = ref<PasFotoSize>('3x4');
const kertas = ref<KertasCetak>('4R');
const siap = ref(false);
const pasUrl = ref('');
const latar = computed(
  () => WARNA_LATAR.find((w) => w.id === warna.value)!.hex,
);

/** The cropped photo at 300 dpi. */
const buatPas = () => {
  const sumber = editor.value?.hasil();
  const m = editor.value?.mask();
  if (!sumber || !m) return null;
  const orang = kotakOrang(m.mask, m.lebar, m.tinggi);
  const cm = PAS_FOTO_CM[ukuran.value];
  const crop = orang
    ? cropPasFoto(orang, m.lebar, m.tinggi, cm.width / cm.height)
    : cropPasFoto(
        { minY: 0, tengahKepalaX: m.lebar / 2 },
        m.lebar,
        m.tinggi,
        cm.width / cm.height,
      );
  const canvas = document.createElement('canvas');
  canvas.width = cmToPx(cm.width);
  canvas.height = cmToPx(cm.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = latar.value;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    sumber,
    crop.x,
    crop.y,
    crop.lebar,
    crop.tinggi,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
};
const perbarui = () => {
  const canvas = buatPas();
  if (!canvas) return;
  if (pasUrl.value) URL.revokeObjectURL(pasUrl.value);
  canvas.toBlob(
    (blob) => blob && (pasUrl.value = URL.createObjectURL(blob)),
    'image/jpeg',
    0.92,
  );
};
watch([warna, ukuran, siap], () => siap.value && nextTick(perbarui));
onBeforeUnmount(() => pasUrl.value && URL.revokeObjectURL(pasUrl.value));

const keBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.95));
const unduhSatu = async () => {
  const canvas = buatPas();
  const blob = canvas && (await keBlob(canvas));
  if (!blob) return;
  downloadBlob(blob, `pas-foto-${ukuran.value}-${warna.value}.jpg`);
  events.download(`${ukuran.value}-${warna.value}`);
};
const unduhLembar = async () => {
  const pas = buatPas();
  if (!pas) return;
  const cm = PAS_FOTO_CM[ukuran.value];
  const k = KERTAS_CETAK[kertas.value];
  const tata = tataLembar(kertas.value, { lebar: cm.width, tinggi: cm.height });
  const canvas = document.createElement('canvas');
  canvas.width = cmToPx(k.lebar);
  canvas.height = cmToPx(k.tinggi);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const p of tata.posisi)
    ctx.drawImage(pas, cmToPx(p.x), cmToPx(p.y), pas.width, pas.height);
  const blob = await keBlob(canvas);
  if (!blob) return;
  downloadBlob(blob, `lembar-pas-foto-${ukuran.value}-${kertas.value}.jpg`);
  events.download(`lembar-${kertas.value}`);
};
const jumlahPerLembar = computed(
  () =>
    tataLembar(kertas.value, {
      lebar: PAS_FOTO_CM[ukuran.value].width,
      tinggi: PAS_FOTO_CM[ukuran.value].height,
    }).posisi.length,
);
const faqs = [
  {
    q: 'Latar merah atau biru dipakai untuk apa?',
    a: 'Tidak ada aturan nasional tunggal. Banyak instansi dan sekolah meminta merah atau biru sesuai ketentuan masing-masing (misalnya tahun lahir genap/ganjil di beberapa sekolah, atau ketentuan formasi CPNS). Selalu ikuti pengumuman instansi yang meminta.',
  },
  {
    q: 'Ukuran pas foto berapa piksel?',
    a: 'Pada 300 dpi: 2x3 cm = 236x354 piksel, 3x4 cm = 354x472 piksel, 4x6 cm = 472x709 piksel.',
  },
  {
    q: 'Bisa dicetak sendiri?',
    a: 'Bisa. Unduh lembar cetak 4R atau A4 berisi beberapa pas foto, lalu cetak di tempat cetak foto tanpa diperbesar (skala 100%).',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Pas Foto Latar Merah/Biru"
    seo-title="Ganti Background Pas Foto Merah atau Biru Online (2x3, 3x4, 4x6)"
    description="Buat pas foto latar merah, biru, atau putih ukuran 2x3, 3x4, dan 4x6 dari foto biasa, plus lembar cetak 4R/A4. Diproses di browser, tanpa upload."
    :faqs="faqs"
    application-category="MultimediaApplication"
    :sources="[LISENSI_MODEL]"
    checked-at="2026-11-06"
    wide
  >
    <LatarFoto ref="editor" :slug="SLUG" :latar="latar" @siap="siap = true" />
    <section v-if="siap" class="card space-y-3">
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label for="pf-warna" class="field-label">Warna latar</label>
          <select id="pf-warna" v-model="warna" class="field-input">
            <option v-for="w in WARNA_LATAR" :key="w.id" :value="w.id">
              {{ w.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="pf-ukuran" class="field-label">Ukuran</label>
          <select id="pf-ukuran" v-model="ukuran" class="field-input">
            <option v-for="(_, k) in PAS_FOTO_CM" :key="k" :value="k">
              {{ k }} cm
            </option>
          </select>
        </div>
        <div>
          <label for="pf-kertas" class="field-label">Lembar cetak</label>
          <select id="pf-kertas" v-model="kertas" class="field-input">
            <option value="4R">4R (10,2 x 15,2 cm)</option>
            <option value="A4">A4</option>
          </select>
        </div>
      </div>
      <img
        v-if="pasUrl"
        :src="pasUrl"
        alt="Pratinjau pas foto"
        class="mx-auto h-48 border"
      />
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-primary" @click="unduhSatu">
          Unduh pas foto
        </button>
        <button type="button" class="btn-secondary" @click="unduhLembar">
          Unduh lembar cetak ({{ jumlahPerLembar }} foto)
        </button>
      </div>
      <DonationCta placement="after-download" :slug="SLUG" />
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/hapus-latar-foto" class="btn-link"
        >Hapus latar foto</NuxtLink
      ><NuxtLink to="/kompres-gambar" class="btn-link">Kompres foto</NuxtLink>
    </nav>
  </ToolShell>
</template>
