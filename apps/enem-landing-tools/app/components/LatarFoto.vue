<script setup lang="ts">
import { normalizeImage } from '~/utils/browser-files';
import { hexKeRgb, komposit } from '~/utils/files/latar';

/**
 * Photo + person mask + brush correction (Story 48). Emits nothing to the
 * network: the model runs here and the photo stays in this tab.
 */
const props = defineProps<{ slug: string; latar: string | null }>();
const emit = defineEmits<{ siap: [] }>();
const events = useToolEvents(props.slug);
const { muat, segmentasi } = useSegmentasi();

const MAKS = 1600;
const foto = shallowRef<ImageData | null>(null);
const mask = shallowRef<Uint8ClampedArray | null>(null);
const preview = ref<HTMLCanvasElement | null>(null);
const status = ref<'kosong' | 'memuat' | 'siap' | 'gagal'>('kosong');
const error = ref('');
const kuas = ref<'hapus' | 'kembalikan' | null>(null);
const ukuranKuas = ref(30);

onMounted(() => {
  // Start fetching the model while the user picks a photo.
  void muat().catch(() => undefined);
});

const gambar = () => {
  if (!foto.value || !mask.value) return null;
  const rgb = props.latar ? hexKeRgb(props.latar) : null;
  return new ImageData(
    komposit(foto.value.data, mask.value, rgb),
    foto.value.width,
    foto.value.height,
  );
};
const render = () => {
  const data = gambar();
  const canvas = preview.value;
  if (!data || !canvas) return;
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext('2d')!.putImageData(data, 0, 0);
};
watch(() => props.latar, render);

const pick = async (files: File[]) => {
  const file = files[0];
  if (!file) return;
  status.value = 'memuat';
  error.value = '';
  try {
    const { blob } = await normalizeImage(file);
    const bitmap = await createImageBitmap(blob);
    const skala = Math.min(1, MAKS / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * skala);
    canvas.height = Math.round(bitmap.height * skala);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    foto.value = ctx.getImageData(0, 0, canvas.width, canvas.height);
    mask.value = await segmentasi(canvas);
    status.value = 'siap';
    events.calculate('segmentasi');
    await nextTick();
    render();
    emit('siap');
  } catch (caught) {
    status.value = 'gagal';
    error.value =
      caught instanceof Error ? caught.message : 'Foto tidak bisa diproses.';
  }
};

// Brush correction on the mask, in image pixels.
let melukis = false;
const sapu = (event: PointerEvent) => {
  if (!melukis || !kuas.value || !mask.value || !foto.value || !preview.value)
    return;
  const box = preview.value.getBoundingClientRect();
  const cx = ((event.clientX - box.left) / box.width) * foto.value.width;
  const cy = ((event.clientY - box.top) / box.height) * foto.value.height;
  const r = (ukuranKuas.value / box.width) * foto.value.width;
  const nilai = kuas.value === 'hapus' ? 0 : 255;
  const { width, height } = foto.value;
  for (
    let y = Math.max(0, Math.floor(cy - r));
    y < Math.min(height, cy + r);
    y += 1
  )
    for (
      let x = Math.max(0, Math.floor(cx - r));
      x < Math.min(width, cx + r);
      x += 1
    )
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r)
        mask.value[y * width + x] = nilai;
  render();
};
const mulai = (event: PointerEvent) => {
  if (!kuas.value) return;
  melukis = true;
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
  sapu(event);
};
const selesai = () => (melukis = false);

defineExpose({
  /** The composited photo at full working size. */
  hasil: () => {
    const data = gambar();
    if (!data) return null;
    const canvas = document.createElement('canvas');
    canvas.width = data.width;
    canvas.height = data.height;
    canvas.getContext('2d')!.putImageData(data, 0, 0);
    return canvas;
  },
  mask: () =>
    mask.value && foto.value
      ? { mask: mask.value, lebar: foto.value.width, tinggi: foto.value.height }
      : null,
});
</script>

<template>
  <div class="space-y-4">
    <FileDropzone
      accept="image/*,.heic,.heif"
      :multiple="false"
      label="Pilih foto"
      hint="Foto diproses di perangkat ini dan tidak diunggah."
      @files="pick"
    />
    <BusyPanel
      v-if="status === 'memuat'"
      message="Memuat model dan memisahkan latar"
      :slug="slug"
    />
    <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
    <section v-show="status === 'siap'" class="card space-y-3">
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="field-label">Rapikan:</span>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="kuas === 'hapus'"
          @click="kuas = kuas === 'hapus' ? null : 'hapus'"
        >
          Kuas hapus
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="kuas === 'kembalikan'"
          @click="kuas = kuas === 'kembalikan' ? null : 'kembalikan'"
        >
          Kuas kembalikan
        </button>
        <label v-if="kuas" class="flex items-center gap-1"
          >Ukuran
          <input v-model.number="ukuranKuas" type="range" min="5" max="80"
        /></label>
      </div>
      <div class="latar-papan mx-auto max-w-md">
        <canvas
          ref="preview"
          class="block w-full touch-none"
          :class="kuas ? 'cursor-crosshair' : ''"
          aria-label="Pratinjau hasil hapus latar"
          @pointerdown="mulai"
          @pointermove="sapu"
          @pointerup="selesai"
          @pointercancel="selesai"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.latar-papan {
  background: repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 0 0 / 16px
    16px;
}
</style>
