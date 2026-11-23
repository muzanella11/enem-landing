<script lang="ts" setup>
import type { ContainerMetricsList } from '@enem-landing/shared-types';
import { computed } from 'vue';
import {
  formatBytes,
  formatPercent,
  shortServiceName,
} from '../utils/log-format';

/**
 * Apps > Memory: every running container by memory used vs its limit,
 * plus all limits against host RAM (replaces the hand count in the
 * compose.prod.yml header).
 */
const props = defineProps<{ metrics: ContainerMetricsList | null }>();

const limitsPercent = computed(() =>
  props.metrics && props.metrics.hostMemory
    ? (props.metrics.totalLimits / props.metrics.hostMemory) * 100
    : null,
);
const usedTotal = computed(() =>
  (props.metrics?.containers ?? []).reduce(
    (sum, c) => sum + (c.memoryCurrent ?? 0),
    0,
  ),
);
</script>

<template>
  <div class="pa-4" data-testid="memory-table">
    <div class="d-flex flex-wrap ga-8 mb-4">
      <StatLine
        label="Total limit semua container"
        :value="formatBytes(metrics?.totalLimits)"
      />
      <StatLine label="RAM host" :value="formatBytes(metrics?.hostMemory)" />
      <StatLine
        label="Limit dibanding RAM"
        :value="formatPercent(limitsPercent)"
        :tone="(limitsPercent ?? 0) > 100 ? 'warning' : undefined"
      />
      <StatLine label="Terpakai sekarang" :value="formatBytes(usedTotal)" />
    </div>
    <v-table density="compact" class="c-data-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Stack</th>
          <th style="min-width: 200px">Memory / limit</th>
          <th>Terpakai</th>
          <th>Limit</th>
          <th>Peak</th>
          <th>CPU</th>
          <th>oom_kill</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in metrics?.containers ?? []" :key="row.id">
          <td>{{ shortServiceName(row.service, row.stack) }}</td>
          <td>{{ row.stack || '-' }}</td>
          <td><UsageBar :percent="row.memoryPercent" /></td>
          <td>{{ formatBytes(row.memoryCurrent) }}</td>
          <td>
            {{ row.memoryMax ? formatBytes(row.memoryMax) : 'tanpa limit' }}
          </td>
          <td>{{ formatBytes(row.memoryPeak) }}</td>
          <td>{{ row.cpuPercent === null ? '-' : `${row.cpuPercent}%` }}</td>
          <td
            :class="{ 'text-error font-weight-bold': (row.oomKills ?? 0) > 0 }"
          >
            {{ row.oomKills ?? '-' }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
