<script lang="ts" setup>
import type {
  MysqlSizes,
  MysqlStats,
  SlowQueryPattern,
} from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import { useContainerMetrics } from '../composables/use-container-metrics';
import { useContainers } from '../composables/use-containers';
import { errorMessage } from '../composables/use-logs-api';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import { useSources } from '../composables/use-sources';
import {
  formatBytes,
  formatDateTime,
  formatDuration,
} from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'DB' });

const tab = ref('stats');
const { list: containers } = useContainers();
const { data: metrics } = useContainerMetrics();
const { sources, error } = useSources();
const slowSources = computed(() =>
  sources.value.filter((source) => source.group === 'db'),
);

const { data: stats, error: statsError } = usePoll(
  () => monitorFetch<MysqlStats>('db/stats'),
  30_000,
);
const connectionPercent = computed(() =>
  stats.value?.maxConnections && stats.value.threadsConnected !== null
    ? (stats.value.threadsConnected / stats.value.maxConnections) * 100
    : null,
);

const sizes = ref<MysqlSizes | null>(null);
const patterns = ref<{
  patterns: SlowQueryPattern[];
  entries: number;
  truncated: boolean;
} | null>(null);
const tabError = ref('');
watch(
  tab,
  async (value) => {
    tabError.value = '';
    try {
      if (value === 'sizes' && !sizes.value)
        sizes.value = await monitorFetch<MysqlSizes>('db/sizes');
      if (value === 'patterns' && !patterns.value)
        patterns.value = await monitorFetch('db/slow-patterns');
    } catch (err) {
      tabError.value = errorMessage(err);
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="DB"
      subtitle="MySQL self-host: koneksi, ukuran database, pola slow query, log container, dan slow query log."
    />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="stats">Statistik</v-tab>
        <v-tab value="sizes">Ukuran</v-tab>
        <v-tab value="patterns">Pola slow query</v-tab>
        <v-tab value="container">Container MySQL</v-tab>
        <v-tab value="slow">Slow query</v-tab>
      </v-tabs>
      <v-divider />
      <v-alert v-if="tabError" type="error" variant="tonal" class="ma-3">
        {{ tabError }}
      </v-alert>
      <v-window v-model="tab">
        <v-window-item value="stats">
          <div class="pa-4" data-testid="mysql-stats">
            <v-alert
              v-if="statsError || stats?.error"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              {{ statsError || stats?.error }}
            </v-alert>
            <div class="db-grid mb-4">
              <UsageBar
                label="Koneksi / max_connections"
                :percent="connectionPercent"
                :warning="60"
                :error="80"
                :detail="
                  stats?.connected
                    ? `${stats.threadsConnected} dari ${stats.maxConnections} (tertinggi ${stats.maxUsedConnections})`
                    : undefined
                "
              />
              <StatLine
                label="Threads running"
                :value="stats?.threadsRunning"
              />
              <StatLine
                label="Slow queries (sejak start)"
                :value="stats?.slowQueries"
              />
              <StatLine
                label="Aborted connects"
                :value="stats?.abortedConnects"
              />
              <StatLine
                label="Uptime"
                :value="formatDuration(stats?.uptimeSeconds)"
              />
              <StatLine
                label="InnoDB buffer pool"
                :value="formatBytes(stats?.innodbBufferPoolSize)"
              />
            </div>
            <div class="text-subtitle-2 mb-1">
              Query yang sedang jalan lebih dari 1 detik
            </div>
            <v-table density="compact" class="c-data-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>User</th>
                  <th>DB</th>
                  <th>Detik</th>
                  <th>State</th>
                  <th>Query</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in stats?.longRunning ?? []" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.user }}</td>
                  <td>{{ row.db ?? '-' }}</td>
                  <td>{{ row.time }}</td>
                  <td>{{ row.state ?? '-' }}</td>
                  <td>
                    <code>{{ row.info }}</code>
                  </td>
                </tr>
                <tr v-if="!stats?.longRunning.length">
                  <td colspan="6" class="text-medium-emphasis">Tidak ada.</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>
        <v-window-item value="sizes">
          <div class="pa-4" data-testid="mysql-sizes">
            <StatLine
              label="Total folder data MySQL"
              :value="formatBytes(sizes?.totalBytes)"
            />
            <v-row class="mt-2">
              <v-col cols="12" md="5">
                <div class="text-subtitle-2 mb-1">Database</div>
                <v-table density="compact" class="c-data-table">
                  <tbody>
                    <tr v-for="db in sizes?.databases ?? []" :key="db.name">
                      <td>{{ db.name }}</td>
                      <td>{{ db.tables }} tabel</td>
                      <td class="text-right">{{ formatBytes(db.bytes) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
              <v-col cols="12" md="7">
                <div class="text-subtitle-2 mb-1">Tabel terbesar</div>
                <v-table density="compact" class="c-data-table">
                  <tbody>
                    <tr
                      v-for="table in sizes?.topTables ?? []"
                      :key="`${table.database}.${table.table}`"
                    >
                      <td>
                        {{ table.database }}.<b>{{ table.table }}</b>
                      </td>
                      <td class="text-right">{{ formatBytes(table.bytes) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>
            <p class="text-caption text-medium-emphasis mt-2">
              Dari ukuran file .ibd di folder data (mount read-only), tanpa
              membaca isi tabel.
            </p>
          </div>
        </v-window-item>
        <v-window-item value="patterns">
          <div class="pa-4" data-testid="slow-patterns">
            <div class="text-caption text-medium-emphasis mb-2">
              {{ patterns?.entries ?? 0 }} entri slow log dikelompokkan per pola
              (angka dan string diganti ?).
              <span v-if="patterns?.truncated"
                >Hanya bagian terbaru slow.log yang dibaca.</span
              >
            </div>
            <v-table density="compact" class="c-data-table">
              <thead>
                <tr>
                  <th>Pola</th>
                  <th>Jumlah</th>
                  <th>Total (s)</th>
                  <th>Rata-rata (s)</th>
                  <th>Maks (s)</th>
                  <th>Terakhir</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in patterns?.patterns ?? []" :key="row.pattern">
                  <td>
                    <code class="db-query">{{ row.pattern }}</code>
                  </td>
                  <td>{{ row.count }}</td>
                  <td>{{ row.totalTime }}</td>
                  <td>{{ row.avgTime }}</td>
                  <td>{{ row.maxTime }}</td>
                  <td>{{ formatDateTime(row.lastSeen) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>
        <v-window-item value="container">
          <ContainerPanel
            :list="containers"
            :metrics="metrics"
            category="db"
            empty-text="Container MySQL (stack mysql) tidak ditemukan di server."
          />
        </v-window-item>
        <v-window-item value="slow">
          <SourcePanel :sources="slowSources" />
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<style scoped>
.db-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px 24px;
}

.db-query {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
}
</style>
