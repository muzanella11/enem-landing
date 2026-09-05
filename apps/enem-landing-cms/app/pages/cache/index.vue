<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Cache' });

interface CacheEntry {
  key: string;
  ttl: number;
  sizeBytes: number;
  hits: number;
  misses: number;
  active: boolean;
}

interface CacheResponse {
  connected: boolean;
  keys: CacheEntry[];
}

const KEY_LABELS: Record<string, string> = {
  'cache:public:experiences': 'Experiences',
  'cache:public:site-profile': 'Site Profile',
  'cache:public:skills': 'Skills',
};

const POLL_SECONDS = 5;

const snackbar = useGlobalSnackbar();
const data = ref<CacheResponse | null>(null);
const localTtls = ref<Record<string, number>>({});
const loading = ref(true);
const flushingKey = ref<string | null>(null);
const paused = ref(false);
const countdown = ref(POLL_SECONDS);

const headers = [
  { title: 'Cache Key', key: 'key' },
  { title: 'TTL', key: 'ttl' },
  { title: 'Size', key: 'sizeBytes', align: 'end' as const },
  { title: 'Hits', key: 'hits', align: 'end' as const },
  { title: 'Misses', key: 'misses', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const keys = computed(() => data.value?.keys ?? []);
const activeCount = computed(
  () => keys.value.filter((k) => (localTtls.value[k.key] ?? k.ttl) > 0).length,
);
const totalHits = computed(() =>
  keys.value.reduce((sum, k) => sum + k.hits, 0),
);
const totalMisses = computed(() =>
  keys.value.reduce((sum, k) => sum + k.misses, 0),
);
const hitRate = computed(() => {
  const total = totalHits.value + totalMisses.value;
  return total > 0 ? Math.round((totalHits.value / total) * 100) : null;
});

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const formatTtl = (ttl: number) => {
  if (ttl <= 0) return 'Inactive';
  if (ttl < 60) return `${ttl}s`;
  if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`;
  return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`;
};

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    data.value = await $fetch<CacheResponse>('/api/cache');
    const ttls: Record<string, number> = {};
    for (const entry of data.value.keys) ttls[entry.key] = entry.ttl;
    localTtls.value = ttls;
  } catch (err) {
    if (!silent) snackbar.error(err);
  } finally {
    if (!silent) loading.value = false;
  }
};

const flush = async (key: string) => {
  flushingKey.value = key;
  try {
    await $fetch(`/api/cache?key=${encodeURIComponent(key)}`, {
      method: 'delete',
    });
    snackbar.success(key === 'all' ? 'All cache flushed.' : 'Cache flushed.');
    await load(true);
  } catch (err) {
    snackbar.error(err);
  } finally {
    flushingKey.value = null;
  }
};

let ttlTickHandle: ReturnType<typeof setInterval> | undefined;
let pollHandle: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  load(false);

  ttlTickHandle = setInterval(() => {
    const next: Record<string, number> = {};
    for (const [key, value] of Object.entries(localTtls.value)) {
      next[key] = Math.max(0, value - 1);
    }
    localTtls.value = next;
  }, 1000);

  pollHandle = setInterval(() => {
    if (paused.value) return;
    countdown.value -= 1;
    if (countdown.value <= 0) {
      countdown.value = POLL_SECONDS;
      load(true);
    }
  }, 1000);
});

onUnmounted(() => {
  if (ttlTickHandle) clearInterval(ttlTickHandle);
  if (pollHandle) clearInterval(pollHandle);
});
</script>

<template>
  <CListPage title="Cache" :meta="`${keys.length} key`">
    <template #actions>
      <v-btn variant="text" prepend-icon="mdi-refresh" @click="load(false)"
        >Refresh</v-btn
      >
      <v-btn
        color="error"
        variant="flat"
        prepend-icon="mdi-delete-sweep-outline"
        :loading="flushingKey === 'all'"
        :disabled="flushingKey !== null || !data?.connected"
        @click="flush('all')"
        >Flush All</v-btn
      >
    </template>

    <template #prepend>
      <v-row class="mb-4" dense>
        <v-col cols="12" sm="4">
          <CContentCard title="Connection">
            <div class="d-flex align-center ga-2">
              <span
                class="cache-status-dot"
                :class="
                  data?.connected
                    ? 'cache-status-dot--on'
                    : 'cache-status-dot--off'
                "
              />
              <span class="text-body-2 font-weight-medium">{{
                data?.connected ? 'Connected' : 'Disconnected'
              }}</span>
              <v-spacer />
              <span class="text-caption text-medium-emphasis">{{
                paused ? 'Paused' : `Refresh in ${countdown}s`
              }}</span>
              <v-btn
                size="small"
                variant="text"
                :icon="paused ? 'mdi-play' : 'mdi-pause'"
                @click="paused = !paused"
              />
            </div>
          </CContentCard>
        </v-col>
        <v-col cols="12" sm="4">
          <CContentCard title="Active Keys">
            <span class="text-h5 font-weight-bold"
              >{{ activeCount }} / {{ keys.length }}</span
            >
          </CContentCard>
        </v-col>
        <v-col cols="12" sm="4">
          <CContentCard title="Hit Rate">
            <span class="text-h5 font-weight-bold">{{
              hitRate !== null ? `${hitRate}%` : '-'
            }}</span>
            <span
              v-if="hitRate !== null"
              class="text-caption text-medium-emphasis ml-2"
              >{{ totalHits }} hits / {{ totalMisses }} misses</span
            >
          </CContentCard>
        </v-col>
      </v-row>
    </template>

    <v-data-table
      :headers="headers"
      :items="keys"
      :loading="loading"
      item-value="key"
      class="c-data-table"
    >
      <template #item.key="{ item }">
        <div :class="{ 'text-medium-emphasis': !(localTtls[item.key] ?? item.ttl) }">
          <div class="font-weight-medium">
            {{ KEY_LABELS[item.key] ?? item.key }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ item.key }}</div>
        </div>
      </template>
      <template #item.ttl="{ item }">
        {{ formatTtl(localTtls[item.key] ?? item.ttl) }}
      </template>
      <template #item.sizeBytes="{ item }">
        {{ formatBytes(item.sizeBytes) }}
      </template>
      <template #item.hits="{ item }">
        <span :class="item.hits > 0 ? 'text-success font-weight-medium' : ''">{{
          item.hits
        }}</span>
      </template>
      <template #item.misses="{ item }">
        <span
          :class="item.misses > 0 ? 'text-warning font-weight-medium' : ''"
          >{{ item.misses }}</span
        >
      </template>
      <template #item.actions="{ item }">
        <v-btn
          size="small"
          variant="text"
          color="error"
          :loading="flushingKey === item.key"
          :disabled="
            flushingKey !== null ||
            !data?.connected ||
            !(localTtls[item.key] ?? item.ttl)
          "
          @click="flush(item.key)"
          >Flush</v-btn
        >
      </template>
    </v-data-table>
  </CListPage>
</template>

<style scoped>
.cache-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cache-status-dot--on {
  background-color: rgb(var(--v-theme-success));
}

.cache-status-dot--off {
  background-color: rgb(var(--v-theme-error));
}
</style>
