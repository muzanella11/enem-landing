<script setup lang="ts">
import type { TitikPertumbuhan } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

/** Contributions vs value per year (Story 41). Plain SVG, no chart library. */
const props = defineProps<{ points: TitikPertumbuhan[] }>();
const W = 600;
const H = 220;
const PAD = 8;
const max = computed(() =>
  Math.max(1, ...props.points.map((p) => Math.max(p.nilai, p.modal))),
);
const x = (i: number) =>
  PAD + (i / Math.max(1, props.points.length - 1)) * (W - 2 * PAD);
const y = (v: number) => H - PAD - (v / max.value) * (H - 2 * PAD);
const path = (key: 'modal' | 'nilai') =>
  props.points
    .map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`)
    .join(' ');
const last = computed(() => props.points[props.points.length - 1]);
</script>

<template>
  <figure class="space-y-2">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full"
      role="img"
      :aria-label="`Grafik pertumbuhan sampai ${formatRupiah(last?.nilai ?? 0)}`"
    >
      <path
        :d="path('modal')"
        fill="none"
        stroke="#94a3b8"
        stroke-width="2"
        stroke-dasharray="6 4"
      />
      <path :d="path('nilai')" fill="none" stroke="#0f766e" stroke-width="3" />
    </svg>
    <figcaption class="flex gap-4 text-xs text-slate-600">
      <span
        ><span class="inline-block h-0.5 w-4 bg-primary align-middle" /> Nilai
        investasi</span
      >
      <span
        ><span
          class="inline-block h-0.5 w-4 border-t-2 border-dashed border-slate-400 align-middle"
        />
        Total setoran</span
      >
    </figcaption>
  </figure>
</template>
