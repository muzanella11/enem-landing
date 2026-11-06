<script setup lang="ts">
/** Draw a signature with finger, pen, or mouse (Story 32). Nothing leaves the page. */
const emit = defineEmits<{ selesai: [HTMLCanvasElement] }>();
const canvas = ref<HTMLCanvasElement | null>(null);
const kosong = ref(true);
let drawing = false;
let last: { x: number; y: number } | null = null;

onMounted(() => {
  const el = canvas.value!;
  el.width = 800;
  el.height = 300;
  const context = el.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, el.width, el.height);
});

const point = (event: PointerEvent) => {
  const el = canvas.value!;
  const rect = el.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * el.width,
    y: ((event.clientY - rect.top) / rect.height) * el.height,
  };
};
const down = (event: PointerEvent) => {
  drawing = true;
  last = point(event);
  canvas.value!.setPointerCapture(event.pointerId);
};
const move = (event: PointerEvent) => {
  if (!drawing || !last) return;
  const context = canvas.value!.getContext('2d')!;
  const next = point(event);
  context.strokeStyle = '#0b1f4d';
  context.lineWidth = 5;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(last.x, last.y);
  context.lineTo(next.x, next.y);
  context.stroke();
  last = next;
  kosong.value = false;
};
const up = () => {
  drawing = false;
  last = null;
};
const hapus = () => {
  const el = canvas.value!;
  const context = el.getContext('2d')!;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, el.width, el.height);
  kosong.value = true;
};
</script>

<template>
  <div class="space-y-2">
    <canvas
      ref="canvas"
      class="aspect-[8/3] w-full touch-none rounded-lg border border-slate-300 bg-white"
      aria-label="Area tanda tangan"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
      @pointerleave="up"
    />
    <div class="flex gap-2">
      <button type="button" class="btn-secondary" @click="hapus">Ulangi</button>
      <button
        type="button"
        class="btn-primary"
        :disabled="kosong"
        @click="emit('selesai', canvas!)"
      >
        Pakai tanda tangan ini
      </button>
    </div>
  </div>
</template>
