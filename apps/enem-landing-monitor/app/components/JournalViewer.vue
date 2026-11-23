<script lang="ts" setup>
import type { JournalEntry, JournalPage } from '@enem-landing/shared-types';
import { onMounted, ref } from 'vue';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import {
  formatDateTime,
  JOURNAL_PRIORITIES,
  localInputToUtc,
} from '../utils/log-format';

/** journald, read by the log-reader with `journalctl --directory`. */
const unit = ref<string | null>(null);
const priority = ref<number | null>(null);
const since = ref('');
const until = ref('');
const search = ref('');
const limit = ref(100);
const units = ref<string[]>([]);
const rows = ref<JournalEntry[]>([]);
const nextCursor = ref<string | null>(null);
const loading = ref(false);
const error = ref('');

const headers = [
  { title: 'Waktu', key: 'time', width: 190 },
  { title: 'Prio', key: 'priority', width: 60 },
  { title: 'Unit', key: 'unit', width: 180 },
  { title: 'Proses', key: 'identifier', width: 140 },
  { title: 'Pesan', key: 'message' },
];

const priorityColor = (value: number | null) =>
  value === null
    ? undefined
    : value <= 3
      ? 'error'
      : value === 4
        ? 'warning'
        : undefined;

const load = async (older = false) => {
  loading.value = true;
  error.value = '';
  try {
    const page = await logsFetch<JournalPage>('journal', {
      unit: unit.value ?? undefined,
      priority: priority.value ?? undefined,
      since: localInputToUtc(since.value),
      until: localInputToUtc(until.value),
      q: search.value.trim() || undefined,
      limit: limit.value,
      cursor: older ? (nextCursor.value ?? undefined) : undefined,
    });
    const newestFirst = [...page.entries].reverse();
    rows.value = older ? [...rows.value, ...newestFirst] : newestFirst;
    nextCursor.value = page.nextCursor;
  } catch (err) {
    error.value = errorMessage(err);
    if (!older) rows.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  load();
  units.value = await logsFetch<string[]>('journal/units').catch(() => []);
});
</script>

<template>
  <div>
    <div class="d-flex flex-wrap ga-2 pa-3 align-center">
      <v-autocomplete
        v-model="unit"
        :items="units"
        label="Unit"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="min-width: 220px; max-width: 280px"
      />
      <v-select
        v-model="priority"
        :items="JOURNAL_PRIORITIES"
        label="Prioritas maks"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 170px"
      />
      <v-text-field
        v-model="since"
        type="datetime-local"
        label="Dari"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 220px"
      />
      <v-text-field
        v-model="until"
        type="datetime-local"
        label="Sampai"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 220px"
      />
      <v-select
        v-model="limit"
        :items="[100, 500, 1000]"
        label="Baris"
        density="compact"
        hide-details
        variant="outlined"
        style="max-width: 110px"
      />
      <v-text-field
        v-model="search"
        label="Cari pesan"
        density="compact"
        hide-details
        variant="outlined"
        clearable
        style="max-width: 260px"
        @keyup.enter="load()"
      />
      <v-btn variant="tonal" color="primary" :loading="loading" @click="load()">
        Terapkan
      </v-btn>
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="ma-3">
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
      <template #item.priority="{ value }">
        <v-chip
          v-if="value !== null"
          size="x-small"
          :color="priorityColor(value)"
          variant="tonal"
          >{{ value }}</v-chip
        >
      </template>
      <template #item.message="{ value }">
        <span class="journal-message">{{ value }}</span>
      </template>
    </v-data-table>
    <div v-if="nextCursor" class="pa-2 text-center">
      <v-btn variant="text" :loading="loading" @click="load(true)">
        Muat lebih lama
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.journal-message {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
