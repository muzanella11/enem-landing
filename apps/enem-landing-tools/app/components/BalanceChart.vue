<script setup lang="ts">
import type { ScheduleRow } from '~/utils/loan';
import { formatRupiah } from '~/utils/format';

/**
 * Yearly view of the loan: bars split into principal and interest paid
 * that year, with the remaining balance as a line. Plain SVG - no chart
 * library on this page.
 */
const props = defineProps<{ schedule: ScheduleRow[]; principal: number }>();

const years = computed(() => {
  const result: {
    year: number;
    principal: number;
    interest: number;
    balance: number;
  }[] = [];
  for (const row of props.schedule) {
    const index = Math.ceil(row.month / 12) - 1;
    const entry = (result[index] ??= {
      year: index + 1,
      principal: 0,
      interest: 0,
      balance: 0,
    });
    entry.principal += row.principal + row.prepayment;
    entry.interest += row.interest;
    entry.balance = row.balance;
  }
  return result;
});

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 10, right: 10, bottom: 24, left: 10 };
const innerW = WIDTH - PAD.left - PAD.right;
const innerH = HEIGHT - PAD.top - PAD.bottom;

const maxPaid = computed(() =>
  Math.max(1, ...years.value.map((year) => year.principal + year.interest)),
);
const barWidth = computed(() => innerW / Math.max(1, years.value.length));

const balancePath = computed(() =>
  years.value
    .map((year, index) => {
      const x = PAD.left + barWidth.value * (index + 0.5);
      const y =
        PAD.top + innerH * (1 - year.balance / Math.max(1, props.principal));
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' '),
);

const labelEvery = computed(() =>
  Math.max(1, Math.ceil(years.value.length / 10)),
);
</script>

<template>
  <figure>
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="h-auto w-full"
      role="img"
      aria-label="Grafik pembayaran pokok, bunga, dan sisa pokok per tahun"
    >
      <g v-for="(year, index) in years" :key="year.year">
        <title>
          Tahun {{ year.year }}: pokok {{ formatRupiah(year.principal) }}, bunga
          {{ formatRupiah(year.interest) }}, sisa
          {{ formatRupiah(year.balance) }}
        </title>
        <rect
          :x="PAD.left + barWidth * index + 1"
          :width="Math.max(1, barWidth - 2)"
          :y="
            PAD.top + innerH * (1 - (year.principal + year.interest) / maxPaid)
          "
          :height="innerH * (year.interest / maxPaid)"
          class="fill-amber-400"
        />
        <rect
          :x="PAD.left + barWidth * index + 1"
          :width="Math.max(1, barWidth - 2)"
          :y="PAD.top + innerH * (1 - year.principal / maxPaid)"
          :height="innerH * (year.principal / maxPaid)"
          class="fill-primary"
        />
        <text
          v-if="index % labelEvery === 0"
          :x="PAD.left + barWidth * (index + 0.5)"
          :y="HEIGHT - 6"
          text-anchor="middle"
          class="fill-slate-500 text-[10px]"
        >
          {{ year.year }}
        </text>
      </g>
      <path
        :d="balancePath"
        fill="none"
        class="stroke-slate-800"
        stroke-width="2"
      />
    </svg>
    <figcaption class="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
      <span class="flex items-center gap-1"
        ><span class="h-3 w-3 rounded-sm bg-primary" />Pokok dibayar per
        tahun</span
      >
      <span class="flex items-center gap-1"
        ><span class="h-3 w-3 rounded-sm bg-amber-400" />Bunga dibayar per
        tahun</span
      >
      <span class="flex items-center gap-1"
        ><span class="h-0.5 w-4 bg-slate-800" />Sisa pokok (skala terhadap
        plafon)</span
      >
    </figcaption>
  </figure>
</template>
