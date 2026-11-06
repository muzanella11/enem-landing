<script setup lang="ts">
import { renderSVG } from 'uqr';
import { downloadBlob } from '~/utils/browser-files';

/** QR image built in the browser (uqr), downloadable as SVG or PNG. */
const props = withDefaults(
  defineProps<{ value: string; filename?: string; slug: string }>(),
  { filename: 'qr-code' },
);
const ecc = ref<'L' | 'M' | 'Q' | 'H'>('M');
const warna = ref('#000000');
const ukuran = ref(512);
const events = useToolEvents(props.slug);

const svg = computed(() => {
  if (!props.value) return '';
  try {
    return renderSVG(props.value, {
      ecc: ecc.value,
      border: 2,
      blackColor: warna.value,
      whiteColor: '#ffffff',
    });
  } catch {
    return '';
  }
});
const dataUrl = computed(() =>
  svg.value
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.value)}`
    : '',
);

const unduhSvg = () => {
  downloadBlob(
    new Blob([svg.value], { type: 'image/svg+xml' }),
    `${props.filename}.svg`,
  );
  events.download('svg');
};
const unduhPng = async () => {
  const image = new Image();
  image.src = dataUrl.value;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = ukuran.value;
  canvas.height = ukuran.value;
  const context = canvas.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, ukuran.value, ukuran.value);
  canvas.toBlob(
    (blob) => blob && downloadBlob(blob, `${props.filename}.png`),
    'image/png',
  );
  events.download('png');
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-3 text-sm">
      <label class="flex items-center gap-2"
        >Koreksi error
        <select v-model="ecc" class="field-input w-auto py-1">
          <option value="L">Rendah</option>
          <option value="M">Sedang</option>
          <option value="Q">Tinggi</option>
          <option value="H">Sangat tinggi</option>
        </select>
      </label>
      <label class="flex items-center gap-2"
        >Warna
        <input
          v-model="warna"
          type="color"
          class="h-8 w-10 rounded border border-slate-300"
      /></label>
      <label class="flex items-center gap-2"
        >Ukuran PNG
        <select v-model.number="ukuran" class="field-input w-auto py-1">
          <option :value="256">256 px</option>
          <option :value="512">512 px</option>
          <option :value="1024">1024 px</option>
        </select>
      </label>
    </div>
    <div v-if="dataUrl" class="flex flex-wrap items-end gap-4">
      <img
        :src="dataUrl"
        alt="Pratinjau QR code"
        class="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
        style="image-rendering: pixelated"
      />
      <div class="flex flex-col gap-2">
        <button type="button" class="btn-primary" @click="unduhPng">
          Unduh PNG
        </button>
        <button type="button" class="btn-secondary" @click="unduhSvg">
          Unduh SVG
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-slate-500">Isi data untuk membuat QR code.</p>
  </div>
</template>
