<script setup lang="ts">
import { formatRupiah } from '~/utils/format';

/** Simple SVG line chart for a daily price series (no chart library). */
const props = defineProps<{
  points: { tanggal: string; pricePerGram: number }[];
}>();
const W = 640;
const H = 200;
const PAD = 8;
const range = computed(() => {
  const values = props.points.map((point) => point.pricePerGram);
  return { min: Math.min(...values), max: Math.max(...values) };
});
const path = computed(() => {
  const { min, max } = range.value;
  const span = max - min || 1;
  return props.points
    .map((point, index) => {
      const x =
        PAD + ((W - 2 * PAD) * index) / Math.max(1, props.points.length - 1);
      const y = PAD + (H - 2 * PAD) * (1 - (point.pricePerGram - min) / span);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
</script>

<template>
  <figure v-if="points.length >= 2">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full"
      role="img"
      :aria-label="`Grafik harga emas dari ${points[0]!.tanggal} sampai ${points[points.length - 1]!.tanggal}`"
    >
      <path :d="path" fill="none" class="stroke-amber-500" stroke-width="2.5" />
    </svg>
    <figcaption
      class="tabular mt-1 flex justify-between text-xs text-slate-500"
    >
      <span>{{ points[0]!.tanggal }}</span>
      <span
        >terendah {{ formatRupiah(range.min) }} · tertinggi
        {{ formatRupiah(range.max) }}</span
      >
      <span>{{ points[points.length - 1]!.tanggal }}</span>
    </figcaption>
  </figure>
  <p v-else class="text-sm text-slate-500">
    Riwayat harga mulai dicatat harian; grafik tampil setelah ada data beberapa
    hari.
  </p>
</template>
