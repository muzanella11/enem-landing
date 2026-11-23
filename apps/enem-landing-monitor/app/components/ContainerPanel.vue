<script lang="ts" setup>
import type {
  ContainerCategory,
  ContainerInfo,
  ContainerList,
} from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import {
  exitCodeMeaning,
  formatAgo,
  formatDateTime,
  isRecentStart,
} from '../utils/log-format';

/**
 * Active containers of one menu (Apps prod/dev, DB, Redis, Server infra),
 * their stopped predecessors, and the log of whichever one is selected.
 */
const props = defineProps<{
  list: ContainerList | null;
  category: ContainerCategory;
  emptyText?: string;
}>();

const running = computed(() =>
  (props.list?.running ?? []).filter((c) => c.category === props.category),
);
const stopped = computed(() =>
  (props.list?.stopped ?? []).filter((c) => c.category === props.category),
);

const selectedId = ref<string | null>(null);
watch(
  running,
  (containers) => {
    const all = [...containers, ...stopped.value];
    if (!all.some((c) => c.id === selectedId.value)) {
      selectedId.value = containers[0]?.id ?? null;
    }
  },
  { immediate: true },
);
const selected = computed<ContainerInfo | undefined>(() =>
  [...running.value, ...stopped.value].find((c) => c.id === selectedId.value),
);

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
      <LogViewer
        :key="selected.id"
        :endpoint="`containers/${selected.id}/entries`"
        :files="selected.files"
        kind="container"
        :title="selected.name"
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
