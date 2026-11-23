<script lang="ts" setup>
import { computed, ref } from 'vue';

export interface ChartSeries {
  label: string;
  points: Array<[number, number]>;
}

/**
 * Small SVG line chart (no chart library on purpose: a few series of at
 * most 1440 points). Time on the x axis, hover shows the nearest values.
 */
const props = withDefaults(
  defineProps<{
    series: ChartSeries[];
    unit?: string;
    height?: number;
    /** Fixed y max (100 for percentages); otherwise from the data. */
    max?: number;
    hours?: number;
    bars?: boolean;
  }>(),
  { unit: '', height: 160, max: undefined, hours: 24, bars: false },
);

const COLORS = [
  '#1abc9c',
  '#1e88e5',
  '#fb8c00',
  '#8e24aa',
  '#e53935',
  '#6d4c41',
];
const WIDTH = 600;
const PAD = { left: 40, right: 8, top: 8, bottom: 20 };

const range = computed(() => {
  const now = Date.now();
  const all = props.series.flatMap((s) => s.points);
  const from = Math.min(now - props.hours * 3_600_000, ...all.map(([t]) => t));
  const to = Math.max(now, ...all.map(([t]) => t));
  const dataMax = Math.max(0, ...all.map(([, v]) => v));
  const max = props.max ?? (dataMax > 0 ? dataMax * 1.15 : 1);
  return { from, to, max };
});

const x = (time: number) =>
  PAD.left +
  ((time - range.value.from) / Math.max(1, range.value.to - range.value.from)) *
    (WIDTH - PAD.left - PAD.right);
const y = (value: number) =>
  props.height -
  PAD.bottom -
  (Math.min(value, range.value.max) / range.value.max) *
    (props.height - PAD.top - PAD.bottom);

/** Breaks the line where samples are missing for more than 3 minutes. */
const paths = computed(() =>
  props.series.map((serie, index) => {
    let d = '';
    let previous: number | null = null;
    for (const [time, value] of serie.points) {
      const gap = previous === null || time - previous > 180_000;
      d += `${gap ? 'M' : 'L'}${x(time).toFixed(1)},${y(value).toFixed(1)}`;
      previous = time;
    }
    return { d, color: COLORS[index % COLORS.length], label: serie.label };
  }),
);

const barWidth = computed(() => {
  const points = props.series[0]?.points.length ?? 1;
  return Math.max(1, (WIDTH - PAD.left - PAD.right) / Math.max(points, 1) - 1);
});

const yTicks = computed(() =>
  [0, 0.5, 1].map((fraction) => ({
    y: y(range.value.max * fraction),
    label: `${Math.round(range.value.max * fraction * 10) / 10}${props.unit}`,
  })),
);

const xTicks = computed(() => {
  const ticks: Array<{ x: number; label: string }> = [];
  const step = props.hours > 48 ? 24 * 3_600_000 : 6 * 3_600_000;
  const start = Math.ceil(range.value.from / step) * step;
  for (let time = start; time <= range.value.to; time += step) {
    const date = new Date(time);
    ticks.push({
      x: x(time),
      label:
        props.hours > 48
          ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
          : date.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
    });
  }
  return ticks;
});

const hover = ref<{
  x: number;
  time: number;
  values: Array<{ label: string; value: number | null; color: string }>;
} | null>(null);

const onMove = (event: MouseEvent) => {
  const svg = event.currentTarget as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const time =
    range.value.from +
    ((px - PAD.left) / (WIDTH - PAD.left - PAD.right)) *
      (range.value.to - range.value.from);
  const values = props.series.map((serie, index) => {
    let best: [number, number] | null = null;
    for (const point of serie.points) {
      if (!best || Math.abs(point[0] - time) < Math.abs(best[0] - time))
        best = point;
    }
    return {
      label: serie.label,
      value: best && Math.abs(best[0] - time) < 5 * 60_000 ? best[1] : null,
      color: COLORS[index % COLORS.length],
    };
  });
  hover.value = {
    x: Math.max(PAD.left, Math.min(WIDTH - PAD.right, px)),
    time,
    values,
  };
};

const empty = computed(() =>
  props.series.every((serie) => !serie.points.length),
);
</script>

<template>
  <div class="line-chart">
    <div v-if="series.length > 1" class="line-chart__legend">
      <span v-for="path in paths" :key="path.label">
        <i :style="{ background: path.color }" />{{ path.label }}
      </span>
    </div>
    <div
      v-if="empty"
      class="line-chart__empty"
      :style="{ height: `${height}px` }"
    >
      Belum ada data.
    </div>
    <svg
      v-else
      :viewBox="`0 0 ${WIDTH} ${height}`"
      preserveAspectRatio="none"
      class="line-chart__svg"
      :style="{ height: `${height}px` }"
      role="img"
      @mousemove="onMove"
      @mouseleave="hover = null"
    >
      <line
        v-for="tick in yTicks"
        :key="tick.label"
        :x1="PAD.left"
        :x2="WIDTH - PAD.right"
        :y1="tick.y"
        :y2="tick.y"
        class="line-chart__grid"
      />
      <text
        v-for="tick in yTicks"
        :key="`l${tick.label}`"
        :x="PAD.left - 4"
        :y="tick.y + 3"
        text-anchor="end"
        class="line-chart__tick"
      >
        {{ tick.label }}
      </text>
      <text
        v-for="tick in xTicks"
        :key="`x${tick.x}`"
        :x="tick.x"
        :y="height - 4"
        text-anchor="middle"
        class="line-chart__tick"
      >
        {{ tick.label }}
      </text>
      <template v-if="bars">
        <rect
          v-for="[time, value] in series[0]?.points ?? []"
          :key="time"
          :x="x(time) - barWidth / 2"
          :y="y(value)"
          :width="barWidth"
          :height="Math.max(0, height - PAD.bottom - y(value))"
          fill="#1abc9c"
        />
      </template>
      <template v-else>
        <path
          v-for="path in paths"
          :key="path.label"
          :d="path.d"
          :stroke="path.color"
          fill="none"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
      </template>
      <line
        v-if="hover"
        :x1="hover.x"
        :x2="hover.x"
        :y1="PAD.top"
        :y2="height - PAD.bottom"
        class="line-chart__cursor"
      />
    </svg>
    <div v-if="hover" class="line-chart__tooltip">
      {{
        new Date(hover.time).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      }}
      <span v-for="value in hover.values" :key="value.label">
        · <i :style="{ background: value.color }" />{{ value.label }}:
        {{
          value.value === null
            ? '-'
            : `${Math.round(value.value * 10) / 10}${unit}`
        }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.line-chart__svg {
  width: 100%;
  display: block;
}

.line-chart__grid {
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.line-chart__cursor {
  stroke: rgba(0, 0, 0, 0.3);
  stroke-dasharray: 3 3;
  vector-effect: non-scaling-stroke;
}

.line-chart__tick {
  font-size: 10px;
  fill: rgba(0, 0, 0, 0.45);
}

.line-chart__legend,
.line-chart__tooltip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.line-chart__legend i,
.line-chart__tooltip i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}

.line-chart__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.4);
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}
</style>
