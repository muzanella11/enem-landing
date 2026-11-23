<script lang="ts" setup>
import type { LogsSummary, LogSourceGroup } from '@enem-landing/shared-types';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContainers } from '../composables/use-containers';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import { formatBytes, formatDateTime } from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Server' });

const TABS = [
  'metrics',
  'summary',
  'security',
  'analysis',
  'system',
  'packages',
  'setup',
  'infra',
];
const route = useRoute();
const router = useRouter();
const tab = ref(
  TABS.includes(String(route.query.tab)) ? String(route.query.tab) : 'metrics',
);
// The tab is part of the URL so alert emails can link straight to it.
watch(tab, (value) => {
  if (route.query.tab !== value)
    router.replace({ query: { ...route.query, tab: value } });
});
const summary = ref<LogsSummary | null>(null);
const error = ref('');
const { list: containers } = useContainers();

onMounted(async () => {
  try {
    summary.value = await logsFetch<LogsSummary>('summary');
  } catch (err) {
    error.value = errorMessage(err);
  }
});

const GROUPS: Array<{ value: LogSourceGroup; title: string }> = [
  { value: 'security', title: 'Keamanan dan Akses' },
  { value: 'system', title: 'Sistem' },
  { value: 'packages', title: 'Paket dan Update' },
  { value: 'setup', title: 'Setup dan Provider' },
];

const sourcesOf = (group: LogSourceGroup) =>
  (summary.value?.sources ?? []).filter((source) => source.group === group);

const summaryRows = computed(() =>
  (summary.value?.sources ?? [])
    .filter((source) => source.group !== 'db')
    .map((source) => ({
      label: source.label,
      group:
        GROUPS.find((g) => g.value === source.group)?.title ?? source.group,
      files: source.files.length,
      size: source.files.reduce((total, file) => total + file.size, 0),
      modifiedAt: source.files[0]?.modifiedAt ?? null,
      format: source.format,
    })),
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Server"
      subtitle="Metrik dan log host VPS (read-only): keamanan, sistem, paket, setup, dan container infra."
    />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary" show-arrows>
        <v-tab value="metrics">Metrik</v-tab>
        <v-tab value="summary">Ringkasan</v-tab>
        <template v-for="group in GROUPS" :key="group.value">
          <v-tab :value="group.value">{{ group.title }}</v-tab>
          <v-tab v-if="group.value === 'security'" value="analysis"
            >Analisis Keamanan</v-tab
          >
        </template>
        <v-tab value="infra">Infra</v-tab>
      </v-tabs>
      <v-divider />

      <v-window v-model="tab">
        <v-window-item value="metrics">
          <MetricsPanel v-if="tab === 'metrics'" />
        </v-window-item>
        <v-window-item value="analysis">
          <SecurityPanel v-if="tab === 'analysis'" />
        </v-window-item>
        <v-window-item value="summary">
          <div class="d-flex flex-wrap ga-8 pa-4">
            <StatLine
              label="Login gagal 24 jam"
              :value="summary?.failedLogins24h"
            />
            <StatLine
              label="Event OOM di kern.log"
              :value="summary?.oomEvents"
              :tone="(summary?.oomEvents ?? 0) > 0 ? 'error' : undefined"
            />
            <StatLine
              label="Ukuran journal"
              :value="formatBytes(summary?.journalSize)"
            />
          </div>
          <v-table
            density="compact"
            class="c-data-table"
            data-testid="source-summary"
          >
            <thead>
              <tr>
                <th>Sumber</th>
                <th>Kelompok</th>
                <th>File</th>
                <th>Total ukuran</th>
                <th>Terakhir diubah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in summaryRows" :key="row.label">
                <td>{{ row.label }}</td>
                <td>{{ row.group }}</td>
                <td>{{ row.format === 'journal' ? '-' : row.files }}</td>
                <td>
                  {{
                    row.format === 'journal'
                      ? formatBytes(summary?.journalSize)
                      : formatBytes(row.size)
                  }}
                </td>
                <td>{{ formatDateTime(row.modifiedAt) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <v-window-item
          v-for="group in GROUPS"
          :key="group.value"
          :value="group.value"
        >
          <SourcePanel :sources="sourcesOf(group.value)" />
        </v-window-item>

        <v-window-item value="infra">
          <ContainerPanel
            :list="containers"
            category="infra"
            empty-text="Tidak ada container infra (Traefik, log-reader)."
          />
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>
