<script lang="ts" setup>
import type {
  ContainerCategory,
  ContainerInfo,
  ContainerList,
  ContainerMetrics,
  ContainerMetricsList,
  MetricSeries,
} from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { monitorFetch } from '../composables/use-monitor-api';
import {
  cleanQuery,
  exitCodeMeaning,
  formatAgo,
  formatBytes,
  formatDateTime,
  isRecentStart,
  VIEWER_QUERY_KEYS,
} from '../utils/log-format';

/**
 * Active containers of one menu (Apps prod/dev, DB, Redis, Server infra),
 * their stopped predecessors, and the log of whichever one is selected.
 */
const props = defineProps<{
  list: ContainerList | null;
  category: ContainerCategory;
  emptyText?: string;
  metrics?: ContainerMetricsList | null;
}>();

const route = useRoute();
const router = useRouter();

const metricsOf = (id: string): ContainerMetrics | undefined =>
  props.metrics?.containers.find((m) => m.id === id);

const running = computed(() =>
  (props.list?.running ?? []).filter((c) => c.category === props.category),
);
const stopped = computed(() =>
  (props.list?.stopped ?? []).filter((c) => c.category === props.category),
);

// `?container=<id>` (deep link) selects a container, also a stopped one.
const selectedId = ref<string | null>(
  typeof route.query.container === 'string' ? route.query.container : null,
);
watch(
  running,
  (containers) => {
    const all = [...containers, ...stopped.value];
    if (!props.list) return;
    if (!all.some((c) => c.id === selectedId.value)) {
      selectedId.value = containers[0]?.id ?? null;
    }
  },
  { immediate: true },
);
watch(selectedId, (id) => {
  if (!id || route.query.container === id) return;
  // Another container starts from its newest lines.
  router.replace({
    query: { ...cleanQuery(route.query, VIEWER_QUERY_KEYS), container: id },
  });
});
const selected = computed<ContainerInfo | undefined>(() =>
  [...running.value, ...stopped.value].find((c) => c.id === selectedId.value),
);

// 24 h memory/CPU chart of the selected container's service.
const history = ref<MetricSeries[]>([]);
watch(
  () => selected.value?.running && selected.value.service,
  async (service) => {
    history.value = [];
    if (!service) return;
    try {
      history.value = await monitorFetch<MetricSeries[]>('metrics/history', {
        query: { series: `svc:${service}:mem,svc:${service}:cpu` },
      });
    } catch {
      history.value = [];
    }
  },
  { immediate: true },
);
const historyOf = (suffix: string) =>
  history.value.find((serie) => serie.name.endsWith(suffix))?.points ?? [];

const shortService = (container: ContainerInfo) =>
  container.stack && container.service.startsWith(`${container.stack}_`)
    ? container.service.slice(container.stack.length + 1)
    : container.service;
</script>

<template>
  <div>
    <v-alert
      v-if="list && !running.length && !stopped.length"
      type="info"
      variant="tonal"
      class="ma-3"
    >
      {{ emptyText || 'Tidak ada container.' }}
    </v-alert>

    <div v-if="running.length" class="container-panel__grid pa-3">
      <v-card
        v-for="container in running"
        :key="container.id"
        :class="[
          'container-panel__card',
          { 'container-panel__card--active': container.id === selectedId },
        ]"
        variant="outlined"
        rounded="lg"
        :data-testid="`container-${shortService(container)}`"
        @click="selectedId = container.id"
      >
        <div class="d-flex align-center ga-2">
          <v-icon color="success" size="12">mdi-circle</v-icon>
          <span class="font-weight-medium">{{ shortService(container) }}</span>
          <v-spacer />
          <v-chip
            v-if="container.recentCrash"
            size="x-small"
            color="error"
            variant="flat"
            title="Ada container crash dalam 24 jam terakhir"
            >crash 24j</v-chip
          >
          <v-chip
            v-if="isRecentStart(container.startedAt)"
            size="x-small"
            color="warning"
            variant="tonal"
            title="Start kurang dari 5 menit lalu: deploy baru atau crash loop"
            >baru start</v-chip
          >
        </div>
        <div class="text-caption text-medium-emphasis mt-1">
          {{ container.name }}
        </div>
        <div class="text-caption mt-1">
          Start {{ formatAgo(container.startedAt) }} · restart
          {{ container.restartCount }}
        </div>
        <div
          v-if="metricsOf(container.id)"
          class="mt-2"
          :data-testid="`memory-${shortService(container)}`"
        >
          <UsageBar
            :percent="metricsOf(container.id)?.memoryPercent"
            :label="`Memory ${formatBytes(metricsOf(container.id)?.memoryCurrent)} / ${metricsOf(container.id)?.memoryMax ? formatBytes(metricsOf(container.id)?.memoryMax) : 'tanpa limit'}`"
          />
          <div class="text-caption mt-1">
            CPU
            {{
              metricsOf(container.id)?.cpuPercent === null
                ? '-'
                : `${metricsOf(container.id)?.cpuPercent}%`
            }}
            · peak {{ formatBytes(metricsOf(container.id)?.memoryPeak) }}
            <span
              v-if="(metricsOf(container.id)?.oomKills ?? 0) > 0"
              class="text-error font-weight-bold"
            >
              · oom_kill {{ metricsOf(container.id)?.oomKills }}
            </span>
          </div>
        </div>
      </v-card>
    </div>

    <template v-if="stopped.length">
      <div class="px-4 pt-2 text-subtitle-2">Container sebelumnya</div>
      <v-table density="compact" class="c-data-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Berhenti</th>
            <th>Exit code</th>
            <th>Keterangan</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="container in stopped"
            :key="container.id"
            :class="[
              'container-panel__row',
              {
                'container-panel__row--crash': container.crashed,
                'container-panel__row--active': container.id === selectedId,
              },
            ]"
            @click="selectedId = container.id"
          >
            <td>{{ shortService(container) }}</td>
            <td :title="formatDateTime(container.finishedAt)">
              {{ formatAgo(container.finishedAt) }}
            </td>
            <td>
              <v-chip
                size="x-small"
                :color="container.crashed ? 'error' : undefined"
                variant="tonal"
                >{{ container.exitCode ?? '-' }}</v-chip
              >
              <v-chip
                v-if="container.oomKilled"
                size="x-small"
                color="error"
                variant="flat"
                class="ml-1"
                >OOMKilled</v-chip
              >
            </td>
            <td>
              {{ exitCodeMeaning(container.exitCode, container.oomKilled) }}
            </td>
            <td class="text-error">{{ container.error }}</td>
          </tr>
        </tbody>
      </v-table>
    </template>

    <template v-if="selected">
      <v-divider />
      <div class="px-4 pt-3 text-subtitle-2">
        Log {{ selected.name }}
        <span v-if="!selected.running" class="text-medium-emphasis">
          (berhenti)
        </span>
      </div>
      <div v-if="selected.running" class="px-4 pt-2">
        <LineChart
          :series="[
            { label: 'Memory % limit', points: historyOf(':mem') },
            { label: 'CPU %', points: historyOf(':cpu') },
          ]"
          unit="%"
          :height="110"
        />
      </div>
      <LogViewer
        :key="selected.id"
        :endpoint="`containers/${selected.id}/entries`"
        :files="selected.files"
        kind="container"
        :title="selected.name"
        :follow-endpoint="
          selected.running ? `containers/${selected.id}/follow` : undefined
        "
        :seek-endpoint="`containers/${selected.id}/seek`"
      />
    </template>
  </div>
</template>

<style scoped>
.container-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.container-panel__card {
  padding: 12px;
  cursor: pointer;
}

.container-panel__card--active {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.05);
}

.container-panel__row {
  cursor: pointer;
}

.container-panel__row--crash td:first-child {
  border-left: 3px solid rgb(var(--v-theme-error));
}

.container-panel__row--active {
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
