<script lang="ts" setup>
import type {
  ContainerLogLine,
  LogFileInfo,
  LogPage,
  MysqlSlowEntry,
} from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import {
  cleanQuery,
  type DisplayZone,
  formatBytes,
  formatDateTime,
  formatInZone,
  highlightSegments,
  localInputToUtc,
  prettyJson,
} from '../utils/log-format';
import {
  lineIsoTime,
  loadSavedFilters,
  loadZone,
  type SavedFilter,
  storeSavedFilters,
  storeZone,
} from '../utils/viewer-prefs';

type Kind = 'text' | 'container' | 'mysql-slow';
type Entry = string | ContainerLogLine | MysqlSlowEntry;

/**
 * Shared viewer for every line-based log: host text files, container
 * json-file logs and the MySQL slow log. Reading, search and paging all
 * happen in the log-reader; this renders a page at a time, or follows the
 * file live (SSE). Its state lives in the URL so a view can be shared.
 */
const props = defineProps<{
  /** BFF path under /api/logs, e.g. `sources/auth/entries`. */
  endpoint: string;
  files: LogFileInfo[];
  kind: Kind;
  title?: string;
  /** `sources/<id>/follow` or `containers/<id>/follow`: enables live tail. */
  followEndpoint?: string;
  /** `.../seek`: enables "jump to time". */
  seekEndpoint?: string;
}>();

const route = useRoute();
const router = useRouter();
const snackbar = useGlobalSnackbar();

const queryString = (name: string): string =>
  typeof route.query[name] === 'string' ? (route.query[name] as string) : '';
const queryInt = (name: string): number | undefined => {
  const value = Number(queryString(name));
  return queryString(name) !== '' && Number.isInteger(value) && value >= 0
    ? value
    : undefined;
};

// --------------------------------------------------------------- state
const fileIndex = ref(queryInt('file') ?? 0);
const limit = ref(
  [100, 500, 1000].includes(queryInt('limit') ?? 0)
    ? (queryInt('limit') as number)
    : 100,
);
const search = ref(queryString('q'));
const appliedSearch = ref(queryString('q'));
const stream = ref<'' | 'stdout' | 'stderr'>(
  ['stdout', 'stderr'].includes(queryString('stream'))
    ? (queryString('stream') as 'stdout' | 'stderr')
    : '',
);
/** End offset of the page shown (`null` = newest). Part of the deep link. */
const pageBefore = ref<number | null>(queryInt('before') ?? null);
const highlighted = ref<number | null>(queryInt('hl') ?? null);
const wrap = ref(true);
const autoRefresh = ref(false);
const entries = ref<Entry[]>([]);
const nextBefore = ref<number | null>(null);
const truncated = ref(false);
const loading = ref(false);
const error = ref('');
const expanded = ref<Set<number>>(new Set());
const zone = ref<DisplayZone>('local');
const savedFilters = ref<SavedFilter[]>([]);
const searchField = ref<{ focus: () => void } | null>(null);
const body = ref<HTMLElement | null>(null);

onMounted(() => {
  zone.value = loadZone();
  savedFilters.value = loadSavedFilters();
});
watch(zone, (value) => storeZone(value));

const fileItems = computed(() =>
  props.files.map((file) => ({
    value: file.index,
    title: `${file.name} (${formatBytes(file.size)})${file.supported ? '' : ' - tidak didukung'}`,
  })),
);
const selectedFile = computed(() =>
  props.files.find((file) => file.index === fileIndex.value),
);

/** Writes the viewer state to the URL (replace, no history spam). */
const syncUrl = () => {
  router.replace({
    query: cleanQuery({
      ...route.query,
      file: fileIndex.value ? String(fileIndex.value) : undefined,
      limit: limit.value !== 100 ? String(limit.value) : undefined,
      q: appliedSearch.value || undefined,
      stream: stream.value || undefined,
      before: pageBefore.value !== null ? String(pageBefore.value) : undefined,
      hl: highlighted.value !== null ? String(highlighted.value) : undefined,
    }),
  });
};

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
    const before = older
      ? (nextBefore.value ?? undefined)
      : (pageBefore.value ?? undefined);
    const page = await logsFetch<LogPage<Entry>>(props.endpoint, query(before));
    entries.value = older ? [...page.entries, ...entries.value] : page.entries;
    nextBefore.value = page.nextBefore;
    truncated.value = page.truncated;
    if (!older) {
      expanded.value = new Set();
      await scrollToHighlight();
    } else if (highlighted.value !== null) {
      highlighted.value += page.entries.length;
    }
  } catch (err) {
    error.value = errorMessage(err);
    if (!older) entries.value = [];
  } finally {
    loading.value = false;
  }
};

/** Newest lines again (`g`, refresh, auto refresh). */
const loadLatest = () => {
  pageBefore.value = null;
  highlighted.value = null;
  syncUrl();
  return load();
};

const scrollToHighlight = async () => {
  await nextTick();
  if (highlighted.value === null) {
    if (body.value) body.value.scrollTop = body.value.scrollHeight;
    return;
  }
  body.value
    ?.querySelector(`[data-line="${highlighted.value}"]`)
    ?.scrollIntoView({ block: 'center' });
};

const applySearch = () => {
  appliedSearch.value = search.value.trim();
  pageBefore.value = null;
  highlighted.value = null;
  syncUrl();
  load();
  if (following.value) restartFollow();
};

let initial = true;
watch(
  () => [props.endpoint, props.files.length],
  () => {
    if (!initial) {
      fileIndex.value = 0;
      pageBefore.value = null;
      highlighted.value = null;
    }
    initial = false;
    load();
  },
  { immediate: true },
);
watch([fileIndex, limit, stream], () => {
  pageBefore.value = null;
  highlighted.value = null;
  syncUrl();
  load();
  if (following.value) restartFollow();
});

// Auto refresh only makes sense on the active file (index 0).
let timer: ReturnType<typeof setInterval> | undefined;
watch(autoRefresh, (enabled) => {
  clearInterval(timer);
  if (enabled) {
    stopFollow();
    timer = setInterval(() => !loading.value && loadLatest(), 10_000);
  }
});

// ----------------------------------------------------------- live tail
const MAX_LIVE_LINES = 5000;
const FOLLOW_MAX_MS = 15 * 60_000;
const following = ref(false);
const followNotice = ref('');
let source: EventSource | null = null;
let followTimer: ReturnType<typeof setTimeout> | undefined;

const stopFollow = (notice = '') => {
  source?.close();
  source = null;
  clearTimeout(followTimer);
  following.value = false;
  followNotice.value = notice;
};

const startFollow = async () => {
  if (!props.followEndpoint || following.value) return;
  autoRefresh.value = false;
  if (fileIndex.value !== 0) fileIndex.value = 0;
  if (pageBefore.value !== null) await loadLatest();
  const params = new URLSearchParams();
  if (appliedSearch.value) params.set('q', appliedSearch.value);
  if (props.kind === 'container' && stream.value)
    params.set('stream', stream.value);
  source = new EventSource(`/api/stream/${props.followEndpoint}?${params}`);
  following.value = true;
  followNotice.value = '';
  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as {
        entries: Entry[];
        rotated?: boolean;
      };
      if (data.rotated)
        followNotice.value = 'File dirotasi, lanjut dari file baru.';
      if (!data.entries.length) return;
      const atBottom =
        !body.value ||
        body.value.scrollHeight -
          body.value.scrollTop -
          body.value.clientHeight <
          40;
      entries.value = [...entries.value, ...data.entries].slice(
        -MAX_LIVE_LINES,
      );
      if (atBottom)
        nextTick(
          () => body.value && (body.value.scrollTop = body.value.scrollHeight),
        );
    } catch {
      // ignore a malformed event
    }
  };
  source.addEventListener('end', () =>
    stopFollow('Live tail berhenti setelah 15 menit.'),
  );
  source.onerror = () => {
    // EventSource reconnects by itself; a closed stream (429, 401) does not.
    if (source?.readyState === EventSource.CLOSED)
      stopFollow('Live tail terputus (mungkin sudah 3 stream terbuka).');
  };
  followTimer = setTimeout(
    () => stopFollow('Live tail berhenti setelah 15 menit.'),
    FOLLOW_MAX_MS,
  );
};

const restartFollow = () => {
  stopFollow();
  startFollow();
};

const onVisibility = () => {
  if (document.hidden && following.value)
    stopFollow('Live tail berhenti karena tab tidak aktif.');
};

// --------------------------------------------------------- jump to time
const jumpTime = ref('');
const jump = async () => {
  const time = localInputToUtc(jumpTime.value);
  if (!time || !props.seekEndpoint) return;
  stopFollow();
  try {
    const result = await logsFetch<{ before: number }>(props.seekEndpoint, {
      file: fileIndex.value,
      time: `${time}:00Z`,
    });
    pageBefore.value = result.before;
    highlighted.value = null;
    syncUrl();
    await load();
  } catch (err) {
    snackbar.error(errorMessage(err));
  }
};

// ------------------------------------------------------- saved filters
const filterName = ref('');
const saveFilter = () => {
  const name =
    filterName.value.trim() || appliedSearch.value || stream.value || 'filter';
  const next = [
    ...savedFilters.value.filter((filter) => filter.name !== name),
    { name, q: appliedSearch.value, stream: stream.value },
  ];
  savedFilters.value = next;
  filterName.value = '';
  if (!storeSavedFilters(next))
    snackbar.error('Browser memblokir penyimpanan lokal');
};
const applyFilter = (filter: SavedFilter) => {
  search.value = filter.q;
  if (props.kind === 'container') stream.value = filter.stream;
  applySearch();
};
const removeFilter = (name: string) => {
  savedFilters.value = savedFilters.value.filter(
    (filter) => filter.name !== name,
  );
  storeSavedFilters(savedFilters.value);
};

// ---------------------------------------------------------- line tools
const lineText = (entry: Entry): string => {
  if (typeof entry === 'string') return entry;
  if ('stream' in entry)
    return `${entry.time} [${entry.stream}] ${entry.message}`;
  return `# Time: ${entry.time}\n# User@Host: ${entry.user} @ ${entry.host}\n# Query_time: ${entry.queryTime} Lock_time: ${entry.lockTime} Rows_sent: ${entry.rowsSent} Rows_examined: ${entry.rowsExamined}\n${entry.query}`;
};

const copyLine = async (entry: Entry) => {
  try {
    await navigator.clipboard.writeText(lineText(entry));
    snackbar.success('Baris disalin');
  } catch {
    snackbar.error('Clipboard tidak tersedia');
  }
};

/** Highlights a line and puts it in the URL (deep link to this line). */
const linkLine = async (index: number) => {
  stopFollow();
  highlighted.value = index;
  // A page read from the newest end shifts as the file grows: pin it.
  if (pageBefore.value === null && selectedFile.value) {
    pageBefore.value = selectedFile.value.size;
  }
  syncUrl();
  try {
    await navigator.clipboard.writeText(window.location.href);
    snackbar.success('Tautan ke baris ini disalin');
  } catch {
    // The URL is updated anyway.
  }
};

const openTimeline = (iso: string | null) => {
  if (!iso) return;
  router.push({ path: '/timeline', query: { around: iso } });
};

const timeOf = (entry: Entry): string | null =>
  typeof entry === 'string' ? lineIsoTime(entry) : entry.time || null;

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

// ----------------------------------------------------- keyboard: / and g
const onKey = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === '/') {
    event.preventDefault();
    searchField.value?.focus();
  } else if (event.key === 'g') {
    event.preventDefault();
    loadLatest();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  stopFollow();
  window.removeEventListener('keydown', onKey);
  document.removeEventListener('visibilitychange', onVisibility);
});
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
        ref="searchField"
        v-model="search"
        label="Cari (tidak case-sensitive)"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        prepend-inner-icon="mdi-magnify"
        class="log-viewer__search"
        title="Pintasan: / untuk cari, g untuk ke paling baru"
        @keyup.enter="applySearch"
        @click:clear="
          search = '';
          applySearch();
        "
      />
      <v-btn variant="tonal" color="primary" @click="applySearch">Cari</v-btn>
      <v-menu :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            variant="text"
            prepend-icon="mdi-filter-variant"
            data-testid="saved-filters"
            >Filter</v-btn
          >
        </template>
        <v-card min-width="280" class="pa-3">
          <div class="text-subtitle-2 mb-2">Filter tersimpan (browser ini)</div>
          <div
            v-if="!savedFilters.length"
            class="text-caption text-medium-emphasis mb-2"
          >
            Belum ada.
          </div>
          <div
            v-for="filter in savedFilters"
            :key="filter.name"
            class="d-flex align-center"
          >
            <v-btn
              size="small"
              variant="text"
              class="flex-grow-1 justify-start"
              @click="applyFilter(filter)"
            >
              {{ filter.name }}
            </v-btn>
            <v-btn
              size="x-small"
              variant="text"
              icon="mdi-close"
              @click="removeFilter(filter.name)"
            />
          </div>
          <v-divider class="my-2" />
          <div class="d-flex ga-2">
            <v-text-field
              v-model="filterName"
              placeholder="Nama filter"
              density="compact"
              hide-details
              variant="outlined"
            />
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              @click="saveFilter"
              >Simpan</v-btn
            >
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Menyimpan pencarian{{ kind === 'container' ? ' dan stream' : '' }}
            yang sedang aktif.
          </div>
        </v-card>
      </v-menu>
      <v-spacer />
      <v-select
        v-model="zone"
        :items="[
          { value: 'local', title: 'Zona browser' },
          { value: 'UTC', title: 'UTC' },
          { value: 'Asia/Jakarta', title: 'WIB' },
        ]"
        label="Zona waktu"
        density="compact"
        hide-details
        variant="outlined"
        class="log-viewer__limit"
      />
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
        v-if="followEndpoint && !following"
        variant="tonal"
        color="success"
        prepend-icon="mdi-play"
        data-testid="live-tail"
        @click="startFollow"
        >Live</v-btn
      >
      <v-btn
        v-else-if="following"
        variant="flat"
        color="success"
        prepend-icon="mdi-stop"
        data-testid="live-tail-stop"
        @click="stopFollow()"
        >Live</v-btn
      >
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        title="Muat ulang (paling baru)"
        @click="loadLatest()"
      />
      <v-btn
        icon="mdi-download"
        variant="text"
        :disabled="!entries.length"
        title="Unduh potongan yang tampil"
        @click="download"
      />
    </div>

    <div
      v-if="seekEndpoint && kind !== 'mysql-slow' && !selectedFile?.compressed"
      class="log-viewer__jump"
    >
      <v-text-field
        v-model="jumpTime"
        type="datetime-local"
        label="Loncat ke waktu (zona browser)"
        density="compact"
        hide-details
        variant="outlined"
        class="log-viewer__file"
      />
      <v-btn size="small" variant="tonal" :disabled="!jumpTime" @click="jump"
        >Loncat</v-btn
      >
      <v-btn
        v-if="pageBefore !== null"
        size="small"
        variant="text"
        prepend-icon="mdi-arrow-down"
        @click="loadLatest()"
        >Ke paling baru (g)</v-btn
      >
    </div>

    <v-alert v-if="!files.length" type="info" variant="tonal" class="ma-3">
      File log tidak ditemukan di server.
    </v-alert>
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-3">
      {{ error }}
    </v-alert>
    <v-alert
      v-if="following || followNotice"
      :type="following ? 'success' : 'info'"
      variant="tonal"
      density="compact"
      class="ma-3"
      data-testid="live-status"
    >
      {{ following ? 'Live tail aktif: baris baru muncul otomatis.' : '' }}
      {{ followNotice }}
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
      ref="body"
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
          :data-line="index"
          :class="[
            'log-viewer__slow',
            { 'log-viewer__line--hl': index === highlighted },
          ]"
        >
          <div class="log-viewer__slow-meta">
            <span>{{ formatDateTime(entry.time) }}</span>
            <v-chip size="x-small" color="warning" variant="tonal">
              {{ entry.queryTime.toFixed(2) }} s
            </v-chip>
            <span>rows examined {{ entry.rowsExamined }}</span>
            <span>rows sent {{ entry.rowsSent }}</span>
            <span>{{ entry.user }} @ {{ entry.host }}</span>
            <a class="log-viewer__tool" title="Salin" @click="copyLine(entry)"
              >⧉</a
            >
          </div>
          <pre class="log-viewer__line">{{ entry.query }}</pre>
        </div>
      </template>

      <template v-else-if="kind === 'container'">
        <div
          v-for="(entry, index) in entries as ContainerLogLine[]"
          :key="index"
          :data-line="index"
          :class="[
            'log-viewer__line',
            {
              'log-viewer__line--stderr': entry.stream === 'stderr',
              'log-viewer__line--hl': index === highlighted,
            },
          ]"
        >
          <span class="log-viewer__tools">
            <a
              class="log-viewer__tool"
              title="Salin baris"
              @click="copyLine(entry)"
              >⧉</a
            >
            <a
              class="log-viewer__tool"
              title="Tautan ke baris ini"
              @click="linkLine(index)"
              >#</a
            >
          </span>
          <a
            v-if="entry.time"
            class="log-viewer__time"
            title="Buka timeline semua container di sekitar waktu ini"
            @click="openTimeline(timeOf(entry))"
            >{{ formatInZone(entry.time, zone) }}</a
          >
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
          :data-line="index"
          :class="[
            'log-viewer__line',
            { 'log-viewer__line--hl': index === highlighted },
          ]"
        >
          <span class="log-viewer__tools">
            <a
              class="log-viewer__tool"
              title="Salin baris"
              @click="copyLine(entry)"
              >⧉</a
            >
            <a
              class="log-viewer__tool"
              title="Tautan ke baris ini"
              @click="linkLine(index)"
              >#</a
            >
            <a
              v-if="lineIsoTime(entry)"
              class="log-viewer__tool"
              title="Buka timeline container di sekitar waktu ini"
              @click="openTimeline(lineIsoTime(entry))"
              >⏱</a
            >
          </span>
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
.log-viewer__toolbar,
.log-viewer__jump {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.log-viewer__jump {
  padding-top: 8px;
  padding-bottom: 8px;
}

.log-viewer__file {
  min-width: 220px;
  max-width: 320px;
}

.log-viewer__limit {
  max-width: 140px;
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
  position: relative;
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

.log-viewer__line--hl {
  background: rgba(251, 140, 0, 0.18) !important;
  outline: 1px solid rgba(251, 140, 0, 0.5);
}

.log-viewer__line--stderr {
  color: #ff9e9e;
}

.log-viewer__time {
  color: #7f8ea3;
  margin-right: 8px;
  cursor: pointer;
  text-decoration: none;
}

.log-viewer__time:hover {
  color: #3fcbaf;
  text-decoration: underline;
}

.log-viewer__tools {
  display: none;
  position: absolute;
  right: 8px;
  top: 0;
  background: #1b2633;
  border-radius: 4px;
  padding: 0 4px;
}

.log-viewer__line:hover .log-viewer__tools {
  display: inline-flex;
  gap: 6px;
}

.log-viewer__tool {
  cursor: pointer;
  color: #3fcbaf;
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
