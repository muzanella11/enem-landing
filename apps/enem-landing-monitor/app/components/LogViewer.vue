<script lang="ts" setup>
import type {
  ContainerLogLine,
  LogFileInfo,
  LogPage,
  MysqlSlowEntry,
} from '@enem-landing/shared-types';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import {
  formatBytes,
  formatDateTime,
  highlightSegments,
  prettyJson,
} from '../utils/log-format';

type Kind = 'text' | 'container' | 'mysql-slow';
type Entry = string | ContainerLogLine | MysqlSlowEntry;

/**
 * Shared viewer for every line-based log: host text files, container
 * json-file logs and the MySQL slow log. Reading, search and paging all
 * happen in the log-reader; this only renders a page at a time.
 */
const props = defineProps<{
  /** BFF path under /api/logs, e.g. `sources/auth/entries`. */
  endpoint: string;
  files: LogFileInfo[];
  kind: Kind;
  title?: string;
}>();

const fileIndex = ref(0);
const limit = ref(100);
const search = ref('');
const appliedSearch = ref('');
const stream = ref<'' | 'stdout' | 'stderr'>('');
const wrap = ref(true);
const autoRefresh = ref(false);
const entries = ref<Entry[]>([]);
const nextBefore = ref<number | null>(null);
const truncated = ref(false);
const loading = ref(false);
const error = ref('');
const expanded = ref<Set<number>>(new Set());

const fileItems = computed(() =>
  props.files.map((file) => ({
    value: file.index,
    title: `${file.name} (${formatBytes(file.size)})${file.supported ? '' : ' - tidak didukung'}`,
  })),
);
const selectedFile = computed(() =>
  props.files.find((file) => file.index === fileIndex.value),
);

const query = (before?: number) => ({
  file: fileIndex.value,
  limit: limit.value,
  q: appliedSearch.value || undefined,
  stream: props.kind === 'container' ? stream.value || undefined : undefined,
  before,
});

const load = async (older = false) => {
  if (!props.files.length) return;
  loading.value = true;
  error.value = '';
  try {
    const page = await logsFetch<LogPage<Entry>>(
      props.endpoint,
      query(older ? (nextBefore.value ?? undefined) : undefined),
    );
    entries.value = older ? [...page.entries, ...entries.value] : page.entries;
    nextBefore.value = page.nextBefore;
    truncated.value = page.truncated;
    if (!older) expanded.value = new Set();
  } catch (err) {
    error.value = errorMessage(err);
    if (!older) entries.value = [];
  } finally {
    loading.value = false;
  }
};

const applySearch = () => {
  appliedSearch.value = search.value.trim();
  load();
};

watch(
  () => [props.endpoint, props.files.length],
  () => {
    fileIndex.value = 0;
    load();
  },
  { immediate: true },
);
watch([fileIndex, limit, stream], () => load());

// Auto refresh only makes sense on the active file (index 0).
let timer: ReturnType<typeof setInterval> | undefined;
watch(autoRefresh, (enabled) => {
  clearInterval(timer);
  if (enabled) timer = setInterval(() => !loading.value && load(), 10_000);
});
onBeforeUnmount(() => clearInterval(timer));

const lineText = (entry: Entry): string => {
  if (typeof entry === 'string') return entry;
  if ('stream' in entry)
    return `${entry.time} [${entry.stream}] ${entry.message}`;
  return `# Time: ${entry.time}\n# User@Host: ${entry.user} @ ${entry.host}\n# Query_time: ${entry.queryTime} Lock_time: ${entry.lockTime} Rows_sent: ${entry.rowsSent} Rows_examined: ${entry.rowsExamined}\n${entry.query}`;
};

const download = () => {
  const blob = new Blob([entries.value.map(lineText).join('\n') + '\n'], {
    type: 'text/plain;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(props.title || selectedFile.value?.name || 'log').replace(/[^\w.-]+/g, '_')}.log`;
  link.click();
  URL.revokeObjectURL(url);
};

const toggle = (index: number) => {
  const next = new Set(expanded.value);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  expanded.value = next;
};
</script>

<template>
  <div class="log-viewer">
    <div class="log-viewer__toolbar">
      <v-select
        v-if="files.length > 1"
        v-model="fileIndex"
        :items="fileItems"
        label="File"
        density="compact"
        hide-details
        variant="outlined"
        class="log-viewer__file"
      />
      <v-select
        v-model="limit"
        :items="[100, 500, 1000]"
        label="Baris"
        density="compact"
        hide-details
        variant="outlined"
        class="log-viewer__limit"
      />
      <v-select
        v-if="kind === 'container'"
        v-model="stream"
        :items="[
          { value: '', title: 'Semua' },
          { value: 'stdout', title: 'stdout' },
          { value: 'stderr', title: 'stderr' },
        ]"
        label="Stream"
        density="compact"
        hide-details
        variant="outlined"
        class="log-viewer__limit"
      />
      <v-text-field
        v-model="search"
        label="Cari (tidak case-sensitive)"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        prepend-inner-icon="mdi-magnify"
        class="log-viewer__search"
        @keyup.enter="applySearch"
        @click:clear="
          search = '';
          applySearch();
        "
      />
      <v-btn variant="tonal" color="primary" @click="applySearch">Cari</v-btn>
      <v-spacer />
      <v-switch
        v-model="wrap"
        label="Wrap"
        density="compact"
        hide-details
        color="primary"
      />
      <v-switch
        v-if="fileIndex === 0"
        v-model="autoRefresh"
        label="Auto 10s"
        density="compact"
        hide-details
        color="primary"
      />
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        title="Muat ulang"
        @click="load()"
      />
      <v-btn
        icon="mdi-download"
        variant="text"
        :disabled="!entries.length"
        title="Unduh potongan yang tampil"
        @click="download"
      />
    </div>

    <v-alert v-if="!files.length" type="info" variant="tonal" class="ma-3">
      File log tidak ditemukan di server.
    </v-alert>
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-3">
      {{ error }}
    </v-alert>

    <div v-if="files.length" class="log-viewer__more">
      <v-btn
        v-if="nextBefore !== null"
        size="small"
        variant="text"
        prepend-icon="mdi-arrow-up"
        :loading="loading"
        data-testid="load-older"
        @click="load(true)"
      >
        Muat lebih lama
      </v-btn>
      <span
        v-else-if="entries.length"
        class="text-caption text-medium-emphasis"
      >
        Awal file
      </span>
      <span v-if="truncated" class="text-caption text-warning ml-2">
        Batas baca per request tercapai, klik "Muat lebih lama" untuk lanjut.
      </span>
    </div>

    <div
      v-if="files.length"
      :class="['log-viewer__body', { 'log-viewer__body--nowrap': !wrap }]"
      data-testid="log-lines"
    >
      <div
        v-if="!loading && !entries.length && !error"
        class="pa-4 text-medium-emphasis"
      >
        Tidak ada baris.
      </div>

      <template v-if="kind === 'mysql-slow'">
        <div
          v-for="(entry, index) in entries as MysqlSlowEntry[]"
          :key="index"
          class="log-viewer__slow"
        >
          <div class="log-viewer__slow-meta">
            <span>{{ formatDateTime(entry.time) }}</span>
            <v-chip size="x-small" color="warning" variant="tonal">
              {{ entry.queryTime.toFixed(2) }} s
            </v-chip>
            <span>rows examined {{ entry.rowsExamined }}</span>
            <span>rows sent {{ entry.rowsSent }}</span>
            <span>{{ entry.user }} @ {{ entry.host }}</span>
          </div>
          <pre class="log-viewer__line">{{ entry.query }}</pre>
        </div>
      </template>

      <template v-else-if="kind === 'container'">
        <div
          v-for="(entry, index) in entries as ContainerLogLine[]"
          :key="index"
          :class="[
            'log-viewer__line',
            { 'log-viewer__line--stderr': entry.stream === 'stderr' },
          ]"
        >
          <span class="log-viewer__time">{{
            entry.time ? formatDateTime(entry.time) : ''
          }}</span>
          <template v-if="prettyJson(entry.message)">
            <a class="log-viewer__expand" @click="toggle(index)">
              {{ expanded.has(index) ? '▾' : '▸' }}
            </a>
            <pre v-if="expanded.has(index)" class="log-viewer__json">{{
              prettyJson(entry.message)
            }}</pre>
            <span v-else>{{ entry.message }}</span>
          </template>
          <template v-else>
            <span
              v-for="(segment, segmentIndex) in highlightSegments(
                entry.message,
                appliedSearch,
              )"
              :key="segmentIndex"
              :class="{ 'log-viewer__hit': segment.hit }"
              >{{ segment.text }}</span
            >
          </template>
        </div>
      </template>

      <template v-else>
        <div
          v-for="(entry, index) in entries as string[]"
          :key="index"
          class="log-viewer__line"
        >
          <span
            v-for="(segment, segmentIndex) in highlightSegments(
              entry,
              appliedSearch,
            )"
            :key="segmentIndex"
            :class="{ 'log-viewer__hit': segment.hit }"
            >{{ segment.text }}</span
          >
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.log-viewer__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.log-viewer__file {
  min-width: 220px;
  max-width: 320px;
}

.log-viewer__limit {
  max-width: 120px;
}

.log-viewer__search {
  min-width: 220px;
  max-width: 360px;
}

.log-viewer__more {
  padding: 4px 12px;
  min-height: 32px;
}

.log-viewer__body {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #0f1720;
  color: #d7dde5;
  max-height: 70vh;
  overflow: auto;
  padding: 8px 0;
}

.log-viewer__line {
  padding: 0 12px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  font: inherit;
}

.log-viewer__body--nowrap .log-viewer__line {
  white-space: pre;
  word-break: normal;
}

.log-viewer__line:hover {
  background: rgba(255, 255, 255, 0.04);
}

.log-viewer__line--stderr {
  color: #ff9e9e;
}

.log-viewer__time {
  color: #7f8ea3;
  margin-right: 8px;
}

.log-viewer__hit {
  background: rgba(251, 140, 0, 0.35);
  color: #fff;
}

.log-viewer__expand {
  cursor: pointer;
  color: #3fcbaf;
  margin-right: 4px;
}

.log-viewer__json {
  margin: 0;
  font: inherit;
  color: #b8f0e2;
}

.log-viewer__slow {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 0;
}

.log-viewer__slow-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 0 12px 4px;
  color: #7f8ea3;
}
</style>
