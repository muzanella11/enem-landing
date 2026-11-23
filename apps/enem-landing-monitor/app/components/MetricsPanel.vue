<script lang="ts" setup>
import type { HostMetrics, MetricSeries } from '@enem-landing/shared-types';
import { computed } from 'vue';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import {
  formatBytes,
  formatDuration,
  formatPercent,
} from '../utils/log-format';

/** Server > Metrik: host gauges plus 24 h charts (sampled by prod every minute). */
const { data: host, error } = usePoll(
  () => monitorFetch<HostMetrics>('metrics/host'),
  15_000,
);
const { data: history } = usePoll(
  () =>
    monitorFetch<MetricSeries[]>('metrics/history', {
      query: {
        series: 'host:cpu,host:mem,host:swap,host:load5,host:disk0,host:disk1',
      },
    }),
  60_000,
);
const series = (name: string) =>
  history.value?.find((serie) => serie.name === name)?.points ?? [];

const loadPercent = computed(() =>
  host.value ? (host.value.load[1] / host.value.cpuCount) * 100 : null,
);
</script>

<template>
  <div class="pa-4" data-testid="metrics-panel">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <div class="metrics-grid mb-6">
      <UsageBar
        label="CPU"
        :percent="host?.cpuPercent"
        :detail="host ? `${host.cpuCount} vCPU` : undefined"
      />
      <UsageBar
        label="RAM"
        :percent="host?.memory.percent"
        :detail="
          host
            ? `${formatBytes(host.memory.used)} dari ${formatBytes(host.memory.total)} (tersedia ${formatBytes(host.memory.available)})`
            : undefined
        "
      />
      <UsageBar
        label="Swap"
        :percent="host?.swap.percent"
        :warning="30"
        :error="50"
        :detail="
          host
            ? `${formatBytes(host.swap.used)} dari ${formatBytes(host.swap.total)}`
            : undefined
        "
      />
      <UsageBar
        v-for="disk in host?.disks ?? []"
        :key="disk.label"
        :label="`Disk ${disk.label}`"
        :percent="disk.percent"
        :warning="70"
        :error="80"
        :detail="`${formatBytes(disk.used)} dari ${formatBytes(disk.total)}, sisa ${formatBytes(disk.free)}`"
      />
      <UsageBar
        label="Load 5 menit / vCPU"
        :percent="loadPercent"
        :warning="100"
        :error="200"
        :detail="host ? `load ${host.load.join(' / ')}` : undefined"
      />
      <div>
        <div class="text-caption text-medium-emphasis">Uptime host</div>
        <div class="text-h6 font-weight-bold" data-testid="host-uptime">
          {{ formatDuration(host?.uptimeSeconds) }}
        </div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-1">CPU dan RAM 24 jam</div>
        <LineChart
          :series="[
            { label: 'CPU', points: series('host:cpu') },
            { label: 'RAM', points: series('host:mem') },
            { label: 'Swap', points: series('host:swap') },
          ]"
          unit="%"
          :max="100"
        />
      </v-col>
      <v-col cols="12" md="6">
        <div class="text-subtitle-2 mb-1">Load 5 menit dan disk 24 jam</div>
        <LineChart
          :series="[{ label: 'Load 5m', points: series('host:load5') }]"
          :height="70"
        />
        <LineChart
          :series="[
            { label: 'Disk /', points: series('host:disk0') },
            { label: 'Disk storage', points: series('host:disk1') },
          ]"
          unit="%"
          :max="100"
          :height="80"
        />
      </v-col>
    </v-row>
    <p class="text-caption text-medium-emphasis mt-2">
      Angka langsung dibaca dari /proc dan statfs host. Grafik diambil tiap
      menit oleh monitor prod dan disimpan 2 hari. Swap
      {{ formatPercent(host?.swap.percent) }}.
    </p>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px 24px;
}
</style>
