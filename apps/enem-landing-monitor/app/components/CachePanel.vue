<script lang="ts" setup>
import type { CacheOverview } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import { computed, ref } from 'vue';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import { formatBytes, formatDuration } from '../utils/log-format';

/**
 * Redis > Cache, moved here from the CMS. The keys belong to
 * enem-landing-api of this monitor's environment, which also checks the
 * SuperAdmin role.
 */
const props = defineProps<{ environment?: string }>();
const snackbar = useGlobalSnackbar();
const { data, error, loading, refresh } = usePoll(
  () => monitorFetch<CacheOverview>('cache'),
  10_000,
);
const flushing = ref<string | null>(null);

const totals = computed(() => {
  const keys = data.value?.keys ?? [];
  const hits = keys.reduce((sum, key) => sum + key.hits, 0);
  const misses = keys.reduce((sum, key) => sum + key.misses, 0);
  return {
    active: keys.filter((key) => key.ttl > 0).length,
    hitRate:
      hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : null,
  };
});

const flush = async (key: string) => {
  flushing.value = key;
  try {
    await monitorFetch('cache', { method: 'DELETE', query: { key } });
    snackbar.success(key === 'all' ? 'Semua cache dihapus.' : 'Cache dihapus.');
    await refresh();
  } catch (err) {
    snackbar.error(err);
  } finally {
    flushing.value = null;
  }
};
</script>

<template>
  <div class="pa-4" data-testid="cache-panel">
    <div class="d-flex flex-wrap align-center ga-8 mb-4">
      <StatLine label="Environment" :value="props.environment ?? '-'" />
      <StatLine
        label="Redis"
        :value="data ? (data.connected ? 'Terhubung' : 'Gagal') : null"
        :tone="data ? (data.connected ? 'success' : 'error') : undefined"
      />
      <StatLine
        label="Key aktif"
        :value="data ? `${totals.active} / ${data.keys.length}` : null"
      />
      <StatLine
        label="Hit rate"
        :value="totals.hitRate === null ? '-' : `${totals.hitRate}%`"
      />
      <v-spacer />
      <v-btn
        variant="text"
        icon="mdi-refresh"
        :loading="loading"
        @click="refresh"
      />
      <v-btn
        color="error"
        variant="flat"
        prepend-icon="mdi-delete-sweep-outline"
        :loading="flushing === 'all'"
        :disabled="flushing !== null || !data?.connected"
        @click="flush('all')"
        >Hapus semua</v-btn
      >
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>
    <v-table density="compact" class="c-data-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>TTL</th>
          <th>Ukuran</th>
          <th>Hit</th>
          <th>Miss</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in data?.keys ?? []" :key="entry.key">
          <td :class="{ 'text-medium-emphasis': entry.ttl <= 0 }">
            <code>{{ entry.key }}</code>
          </td>
          <td>
            {{ entry.ttl > 0 ? formatDuration(entry.ttl) : 'Tidak aktif' }}
          </td>
          <td>{{ entry.sizeBytes ? formatBytes(entry.sizeBytes) : '-' }}</td>
          <td>{{ entry.hits }}</td>
          <td>{{ entry.misses }}</td>
          <td class="text-right">
            <v-btn
              size="small"
              variant="text"
              color="error"
              :loading="flushing === entry.key"
              :disabled="flushing !== null || entry.ttl <= 0"
              @click="flush(entry.key)"
              >Hapus</v-btn
            >
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
