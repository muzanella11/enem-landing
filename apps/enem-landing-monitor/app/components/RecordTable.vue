<script lang="ts" setup>
import type {
  FaillogRecord,
  LastlogRecord,
  LogFileInfo,
  LogPage,
  LoginRecord,
} from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import { formatBytes, formatDateTime } from '../utils/log-format';

type Row = LoginRecord | LastlogRecord | FaillogRecord;

/** Binary login logs (`btmp`, `wtmp`, `lastlog`, `faillog`) as a table. */
const props = defineProps<{
  endpoint: string;
  files: LogFileInfo[];
  format: 'utmp' | 'lastlog' | 'faillog';
}>();

const fileIndex = ref(0);
const limit = ref(100);
const search = ref('');
const rows = ref<Row[]>([]);
const nextBefore = ref<number | null>(null);
const loading = ref(false);
const error = ref('');

const headers = computed(() => {
  switch (props.format) {
    case 'utmp':
      return [
        { title: 'Waktu', key: 'time' },
        { title: 'User', key: 'user' },
        { title: 'IP / host', key: 'host' },
        { title: 'TTY', key: 'line' },
        { title: 'Tipe', key: 'type' },
        { title: 'PID', key: 'pid' },
      ];
    case 'lastlog':
      return [
        { title: 'User', key: 'user' },
        { title: 'UID', key: 'uid' },
        { title: 'Login terakhir', key: 'time' },
        { title: 'TTY', key: 'line' },
        { title: 'Dari', key: 'host' },
      ];
    default:
      return [
        { title: 'User', key: 'user' },
        { title: 'UID', key: 'uid' },
        { title: 'Gagal', key: 'failures' },
        { title: 'Maks', key: 'max' },
        { title: 'Gagal terakhir', key: 'lastFailure' },
        { title: 'TTY', key: 'line' },
      ];
  }
});

const load = async (older = false) => {
  if (!props.files.length) return;
  loading.value = true;
  error.value = '';
  try {
    const page = await logsFetch<LogPage<Row>>(props.endpoint, {
      file: fileIndex.value,
      limit: limit.value,
      q: search.value.trim() || undefined,
      before: older ? (nextBefore.value ?? undefined) : undefined,
    });
    // Newest first in the table.
    const newestFirst = [...page.entries].reverse();
    rows.value = older ? [...rows.value, ...newestFirst] : newestFirst;
    nextBefore.value = page.nextBefore;
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.endpoint,
  () => {
    fileIndex.value = 0;
    load();
  },
  { immediate: true },
);
watch([fileIndex, limit], () => load());
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 pa-3 align-center">
      <v-select
        v-if="files.length > 1"
        v-model="fileIndex"
        :items="
          files.map((file) => ({
            value: file.index,
            title: `${file.name} (${formatBytes(file.size)})`,
          }))
        "
        label="File"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 280px"
      />
      <v-select
        v-if="format === 'utmp'"
        v-model="limit"
        :items="[100, 500, 1000]"
        label="Baris"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 120px"
      />
      <v-text-field
        v-model="search"
        label="Filter user / IP"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 320px"
        @keyup.enter="load()"
        @click:clear="
          search = '';
          load();
        "
      />
      <v-btn variant="tonal" color="primary" @click="load()">Filter</v-btn>
    </div>
    <v-alert v-if="!files.length" type="info" variant="tonal" class="ma-3">
      File log tidak ditemukan di server.
    </v-alert>
    <v-alert v-else-if="error" type="error" variant="tonal" class="ma-3">
      {{ error }}
    </v-alert>
    <v-data-table
      v-else
      :headers="headers"
      :items="rows"
      :loading="loading"
      :items-per-page="-1"
      density="compact"
      class="c-data-table"
      hide-default-footer
    >
      <template #item.time="{ value }">{{ formatDateTime(value) }}</template>
      <template #item.lastFailure="{ value }">{{
        formatDateTime(value)
      }}</template>
      <template #item.host="{ item }">
        {{ (item as LoginRecord).ip || (item as LoginRecord).host }}
        <span
          v-if="
            (item as LoginRecord).ip &&
            (item as LoginRecord).host !== (item as LoginRecord).ip
          "
          class="text-medium-emphasis"
        >
          ({{ (item as LoginRecord).host }})
        </span>
      </template>
    </v-data-table>
    <div v-if="nextBefore !== null" class="pa-2 text-center">
      <v-btn variant="text" :loading="loading" @click="load(true)">
        Muat lebih lama
      </v-btn>
    </div>
  </div>
</template>
