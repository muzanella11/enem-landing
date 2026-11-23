<script lang="ts" setup>
import type {
  MonitorOverview,
  RedisSlowlogEntry,
  RedisStats,
} from '@enem-landing/shared-types';
import { ref, watch } from 'vue';
import { useContainerMetrics } from '../composables/use-container-metrics';
import { useContainers } from '../composables/use-containers';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import {
  formatBytes,
  formatDateTime,
  formatDuration,
} from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Redis' });

const tab = ref('stats');
const { list: containers } = useContainers();
const { data: metrics } = useContainerMetrics();
const { data: overview } = await useFetch<MonitorOverview>('/api/overview');
const slowlog = ref<RedisSlowlogEntry[]>([]);
const slowlogError = ref('');
const loading = ref(false);

const {
  data: stats,
  refresh: refreshStats,
  loading: statsLoading,
} = usePoll(() => monitorFetch<RedisStats>('redis/stats'), 30_000);

const loadSlowlog = async () => {
  loading.value = true;
  try {
    slowlog.value = await logsFetch<RedisSlowlogEntry[]>('redis/slowlog', {
      limit: 128,
    });
    slowlogError.value = '';
  } catch (err) {
    slowlogError.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};
watch(tab, (value) => value === 'slowlog' && loadSlowlog());

const rescan = async () => {
  stats.value = await monitorFetch<RedisStats>('redis/stats', {
    query: { refresh: 'true' },
  });
};

const headers = [
  { title: 'Waktu', key: 'time' },
  { title: 'Durasi', key: 'durationMicros' },
  { title: 'Perintah', key: 'command' },
  { title: 'Client', key: 'client' },
];
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Redis"
      subtitle="Redis self-host: memory, hit rate, key per prefix, cache app, log container, dan SLOWLOG."
    />
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="stats">Statistik</v-tab>
        <v-tab value="cache">Cache</v-tab>
        <v-tab value="container">Container Redis</v-tab>
        <v-tab value="slowlog">Slowlog</v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="tab">
        <v-window-item value="stats">
          <div class="pa-4" data-testid="redis-stats">
            <v-alert
              v-if="stats && !stats.connected"
              type="error"
              variant="tonal"
              class="mb-4"
            >
              Redis tidak bisa dihubungi.
            </v-alert>
            <div class="redis-grid mb-4">
              <UsageBar
                label="Memory / maxmemory"
                :percent="stats?.memoryPercent"
                :error="85"
                :detail="
                  stats
                    ? `${formatBytes(stats.usedMemory)} dari ${stats.maxMemory ? formatBytes(stats.maxMemory) : 'tanpa batas'}`
                    : undefined
                "
              />
              <StatLine
                label="Hit rate"
                :value="
                  stats?.hitRate === null || stats?.hitRate === undefined
                    ? '-'
                    : `${stats.hitRate}%`
                "
              />
              <StatLine
                label="Evicted keys"
                :value="stats?.evictedKeys"
                :tone="(stats?.evictedKeys ?? 0) > 0 ? 'warning' : undefined"
              />
              <StatLine
                label="Fragmentasi"
                :value="stats?.fragmentationRatio"
              />
              <StatLine label="Client" :value="stats?.connectedClients" />
              <StatLine label="Total key" :value="stats?.totalKeys" />
              <StatLine
                label="AOF terakhir"
                :value="
                  stats
                    ? `${stats.aofLastWriteStatus ?? '-'} / rewrite ${stats.aofLastRewriteStatus ?? '-'}`
                    : null
                "
                :tone="
                  stats && (stats.aofLastWriteStatus ?? 'ok') !== 'ok'
                    ? 'error'
                    : undefined
                "
              />
              <StatLine
                label="Uptime"
                :value="formatDuration(stats?.uptimeSeconds)"
              />
            </div>
            <div class="d-flex align-center mb-1">
              <span class="text-subtitle-2">Key per prefix</span>
              <span class="text-caption text-medium-emphasis ml-2">
                SCAN {{ formatDateTime(stats?.keysScannedAt) }} (cache 5
                menit){{ stats?.keysTruncated ? ', tidak lengkap' : '' }}
              </span>
              <v-spacer />
              <v-btn
                size="small"
                variant="text"
                :loading="statsLoading"
                @click="rescan"
                >Hitung ulang</v-btn
              >
              <v-btn
                size="small"
                variant="text"
                icon="mdi-refresh"
                @click="refreshStats"
              />
            </div>
            <v-table density="compact" class="c-data-table">
              <tbody>
                <tr v-for="row in stats?.keysByPrefix ?? []" :key="row.prefix">
                  <td>
                    <code>{{ row.prefix }}</code>
                  </td>
                  <td class="text-right">{{ row.count }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>
        <v-window-item value="cache">
          <CachePanel
            v-if="tab === 'cache'"
            :environment="overview?.environment"
          />
        </v-window-item>
        <v-window-item value="container">
          <ContainerPanel
            :list="containers"
            :metrics="metrics"
            category="redis"
            empty-text="Container Redis (stack redis) tidak ditemukan di server."
          />
        </v-window-item>
        <v-window-item value="slowlog">
          <v-alert
            v-if="slowlogError"
            type="error"
            variant="tonal"
            class="ma-3"
          >
            {{ slowlogError }}
          </v-alert>
          <v-data-table
            v-else
            :headers="headers"
            :items="slowlog"
            :loading="loading"
            density="compact"
            class="c-data-table"
          >
            <template #item.time="{ value }">{{
              formatDateTime(value)
            }}</template>
            <template #item.durationMicros="{ value }">
              {{ (value / 1000).toFixed(1) }} ms
            </template>
            <template #item.command="{ value }">
              <code>{{ value }}</code>
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<style scoped>
.redis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 24px;
}
</style>
