<script lang="ts" setup>
import type { TrackingOverview } from '@enem-landing/shared-types';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Heatmap' });

interface HeatmapCell {
  gridX: number;
  gridY: number;
  count: number;
}

const GRID_SIZE = 20;
const IFRAME_HEIGHT = 900;

const config = useRuntimeConfig();
const { data: overview } = await useFetch<TrackingOverview>(
  '/api/tracking/overview',
);
const { data: heatmapPaths } = await useFetch<string[]>(
  '/api/tracking/heatmap-paths',
);
const pathOptions = computed(() => {
  const paths = new Set([
    ...(heatmapPaths.value ?? []),
    ...(overview.value?.topPaths.map((row) => row.path) ?? []),
  ]);
  return paths.size > 0 ? Array.from(paths) : ['/'];
});

const selectedPath = ref(pathOptions.value[0] ?? '/');
const selectedDevice = ref<'mobile' | 'tablet' | 'desktop'>('desktop');
const cells = ref<HeatmapCell[]>([]);
const isLoading = ref(false);
const canvas = ref<HTMLCanvasElement>();

const iframeSrc = computed(
  () => `${config.public.webHost}${selectedPath.value}`,
);

/** Blue (cold/low) -> yellow -> red (hot/high) - the conventional click-heatmap colormap, not a generic magnitude ramp. */
const heatColor = (intensity: number): string => {
  const clamped = Math.max(0, Math.min(1, intensity));
  if (clamped < 0.5) {
    const t = clamped / 0.5;
    return `rgba(${Math.round(t * 255)}, ${Math.round(t * 200)}, ${Math.round(255 - t * 100)}, 0.55)`;
  }
  const t = (clamped - 0.5) / 0.5;
  return `rgba(255, ${Math.round(200 - t * 200)}, ${Math.round(155 - t * 155)}, 0.55)`;
};

const draw = () => {
  if (!canvas.value) return;
  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
  const maxCount = Math.max(1, ...cells.value.map((cell) => cell.count));
  const cellWidth = canvas.value.width / GRID_SIZE;
  const cellHeight = canvas.value.height / GRID_SIZE;

  for (const cell of cells.value) {
    ctx.fillStyle = heatColor(cell.count / maxCount);
    ctx.fillRect(
      cell.gridX * cellWidth,
      cell.gridY * cellHeight,
      cellWidth,
      cellHeight,
    );
  }
};

const load = async () => {
  isLoading.value = true;
  try {
    cells.value = await $fetch<HeatmapCell[]>('/api/tracking/heatmap', {
      params: { path: selectedPath.value, device: selectedDevice.value },
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    draw();
  }
};

const resizeCanvasToIframe = () => {
  if (!canvas.value) return;
  canvas.value.width = canvas.value.clientWidth;
  canvas.value.height = IFRAME_HEIGHT;
  draw();
};

onMounted(() => {
  resizeCanvasToIframe();
  window.addEventListener('resize', resizeCanvasToIframe);
  load();
});

watch([selectedPath, selectedDevice], load);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Activity Tracking Heatmap"
      subtitle="Overlay klik pengunjung di atas halaman publik sungguhan."
    >
      <template #actions>
        <v-btn
          to="/activity-tracking"
          variant="text"
          prepend-icon="mdi-arrow-left"
          >Overview</v-btn
        >
      </template>
    </CPageHeader>

    <CContentCard title="Filter" class="mb-4">
      <div class="d-flex ga-4">
        <v-select
          v-model="selectedPath"
          :items="pathOptions"
          label="Path"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 280px"
        />
        <v-select
          v-model="selectedDevice"
          :items="['desktop', 'tablet', 'mobile']"
          label="Device"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 200px"
        />
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          size="24"
          class="align-self-center"
        />
      </div>
    </CContentCard>

    <CContentCard title="Heatmap" no-padding>
      <div class="heatmap-viewport" :style="{ height: `${IFRAME_HEIGHT}px` }">
        <iframe
          :src="iframeSrc"
          class="heatmap-iframe"
          title="Public page preview"
        />
        <canvas ref="canvas" class="heatmap-canvas" />
      </div>
    </CContentCard>
  </div>
</template>

<style scoped>
.heatmap-viewport {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.heatmap-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  pointer-events: none;
}

.heatmap-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
