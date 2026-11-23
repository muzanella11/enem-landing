<script lang="ts" setup>
import type {
  ContainerCategory,
  TimelinePage,
} from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import {
  cleanQuery,
  formatDateTime,
  formatInZone,
  highlightSegments,
  localInputToUtc,
  shortServiceName,
} from '../utils/log-format';
import { loadZone } from '../utils/viewer-prefs';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Timeline' });

/**
 * Every container's log around one moment: opened from a log
 * line's time, or set by hand. The whole state is in the URL.
 */
const route = useRoute();
const router = useRouter();
const CATEGORIES: Array<{ value: ContainerCategory; title: string }> = [
  { value: 'apps-prod', title: 'Prod' },
  { value: 'apps-dev', title: 'Dev' },
  { value: 'db', title: 'DB' },
  { value: 'redis', title: 'Redis' },
  { value: 'infra', title: 'Infra' },
];
const CATEGORY_PAGE: Record<ContainerCategory, string> = {
  'apps-prod': '/apps?tab=apps-prod',
  'apps-dev': '/apps?tab=apps-dev',
  db: '/db?tab=container',
  redis: '/redis?tab=container',
  infra: '/server?tab=infra',
};

const zone = ref(loadZone());
const queryString = (name: string) =>
  typeof route.query[name] === 'string' ? (route.query[name] as string) : '';

const around = computed(
  () => queryString('around') || new Date().toISOString(),
);
const windowMinutes = computed(() => {
  const value = Number(queryString('window') || 4);
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : 4;
});
const categories = ref<ContainerCategory[]>(
  queryString('categories')
    ? (queryString('categories').split(',') as ContainerCategory[])
    : [],
);
const service = ref(queryString('service'));
const search = ref('');

/** `datetime-local` value of `around`, in the browser's zone. */
const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const aroundInput = ref(toLocalInput(around.value));

const page = ref<TimelinePage | null>(null);
const loading = ref(false);
const error = ref('');

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    page.value = await logsFetch<TimelinePage>('timeline', {
      around: around.value,
      window: windowMinutes.value,
      categories: categories.value.length
        ? categories.value.join(',')
        : undefined,
      service: service.value || undefined,
    });
  } catch (err) {
    error.value = errorMessage(err);
    page.value = null;
  } finally {
    loading.value = false;
  }
};

const apply = (override: Record<string, string | undefined> = {}) => {
  const utc = localInputToUtc(aroundInput.value);
  const query: Record<string, string | undefined> = {
    around: utc ? new Date(`${utc}:00Z`).toISOString() : around.value,
    window: String(windowMinutes.value),
    categories: categories.value.length
      ? categories.value.join(',')
      : undefined,
    service: service.value || undefined,
    ...override,
  };
  router.replace({ query: cleanQuery(query) });
};

watch(() => route.query, load, { immediate: true });
watch(around, (value) => (aroundInput.value = toLocalInput(value)));

const shift = (minutes: number) => {
  const next = new Date(
    Date.parse(around.value) + minutes * 60_000,
  ).toISOString();
  aroundInput.value = toLocalInput(next);
  apply({ around: next });
};

const services = computed(() =>
  [...new Set((page.value?.lines ?? []).map((line) => line.service))].sort(),
);
const lines = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return (page.value?.lines ?? []).filter(
    (line) => !needle || line.message.toLowerCase().includes(needle),
  );
});
const crashIds = computed(
  () => new Set((page.value?.crashes ?? []).map((crash) => crash.containerId)),
);
const COLORS = [
  '#3fcbaf',
  '#64b5f6',
  '#ffb74d',
  '#ce93d8',
  '#e57373',
  '#aed581',
  '#90a4ae',
  '#f06292',
];
const colorOf = (name: string) =>
  COLORS[services.value.indexOf(name) % COLORS.length];
const middle = computed(() => Date.parse(around.value));
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Timeline"
      subtitle="Log semua container (jalan dan berhenti) di sekitar satu waktu, diurutkan per waktu. Maksimal 10 menit dan 2.000 baris."
    />
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <div class="timeline__toolbar">
        <v-text-field
          v-model="aroundInput"
          type="datetime-local"
          label="Sekitar waktu (zona browser)"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 240px"
        />
        <v-select
          :model-value="windowMinutes"
          :items="[1, 2, 4, 6, 10]"
          label="Rentang (menit)"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 140px"
          @update:model-value="
            (value: number) => apply({ window: String(value) })
          "
        />
        <v-select
          v-model="categories"
          :items="CATEGORIES"
          label="Stack (kosong = semua)"
          multiple
          chips
          closable-chips
          density="compact"
          hide-details
          variant="outlined"
          style="min-width: 220px; max-width: 360px"
        />
        <v-select
          v-model="service"
          :items="['', ...services]"
          label="Service"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 260px"
        />
        <v-btn
          color="primary"
          variant="tonal"
          :loading="loading"
          @click="apply()"
          >Tampilkan</v-btn
        >
        <v-btn
          variant="text"
          icon="mdi-chevron-left"
          title="Mundur"
          @click="shift(-windowMinutes)"
        />
        <v-btn
          variant="text"
          icon="mdi-chevron-right"
          title="Maju"
          @click="shift(windowMinutes)"
        />
        <v-spacer />
        <v-text-field
          v-model="search"
          label="Saring baris"
          density="compact"
          hide-details
          variant="outlined"
          clearable
          style="max-width: 220px"
        />
      </div>
      <v-divider />
      <v-alert v-if="error" type="error" variant="tonal" class="ma-3">{{
        error
      }}</v-alert>
      <div v-if="page" class="pa-3 text-caption text-medium-emphasis">
        {{ formatDateTime(page.from) }} s/d {{ formatDateTime(page.to) }} ·
        {{ lines.length }} baris
        <span v-if="page.truncated" class="text-warning">
          · terpotong (batas baris atau waktu baca)</span
        >
      </div>
      <v-alert
        v-for="crash in page?.crashes ?? []"
        :key="crash.containerId"
        type="error"
        variant="tonal"
        density="compact"
        class="mx-3 mb-2"
        data-testid="timeline-crash"
      >
        {{ crash.service }} crash pada
        {{ formatDateTime(crash.finishedAt) }} (exit {{ crash.exitCode ?? '-'
        }}{{ crash.oomKilled ? ', OOMKilled' : '' }})
      </v-alert>
      <div class="timeline__body" data-testid="timeline-lines">
        <div v-if="!loading && !lines.length" class="pa-4 text-medium-emphasis">
          Tidak ada log di rentang ini.
        </div>
        <template v-for="(line, index) in lines" :key="index">
          <div
            v-if="
              index > 0 &&
              Date.parse(lines[index - 1].time) < middle &&
              Date.parse(line.time) >= middle
            "
            class="timeline__marker"
          >
            ── {{ formatInZone(around, zone) }} ──
          </div>
          <div
            :class="[
              'timeline__line',
              {
                'timeline__line--stderr': line.stream === 'stderr',
                'timeline__line--crash': crashIds.has(line.containerId),
              },
            ]"
          >
            <span class="timeline__time">{{
              formatInZone(line.time, zone)
            }}</span>
            <NuxtLink
              class="timeline__service"
              :style="{ color: colorOf(line.service) }"
              :to="`${CATEGORY_PAGE[line.category]}&container=${line.containerId}`"
              :title="line.service"
              >{{ shortServiceName(line.service, line.stack) }}</NuxtLink
            >
            <span
              v-for="(segment, segmentIndex) in highlightSegments(
                line.message,
                search,
              )"
              :key="segmentIndex"
              :class="{ timeline__hit: segment.hit }"
              >{{ segment.text }}</span
            >
          </div>
        </template>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.timeline__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px;
}

.timeline__body {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  background: #0f1720;
  color: #d7dde5;
  max-height: 72vh;
  overflow: auto;
  padding: 8px 0;
}

.timeline__line {
  padding: 0 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.timeline__line--stderr {
  color: #ff9e9e;
}

.timeline__line--crash {
  border-left: 3px solid #e53935;
}

.timeline__time {
  color: #7f8ea3;
  margin-right: 8px;
}

.timeline__service {
  display: inline-block;
  min-width: 160px;
  margin-right: 8px;
  text-decoration: none;
  font-weight: 600;
}

.timeline__hit {
  background: rgba(251, 140, 0, 0.35);
  color: #fff;
}

.timeline__marker {
  text-align: center;
  color: #fb8c00;
  padding: 2px 0;
}
</style>
