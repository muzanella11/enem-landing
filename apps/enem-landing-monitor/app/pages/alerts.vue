<script lang="ts" setup>
import type {
  AlertEntry,
  AlertRule,
  AlertsOverview,
} from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import { computed, ref } from 'vue';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import { EMAIL_STATUS, SEVERITY } from '../utils/alert-labels';
import { formatDateTime } from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Alerts' });

const config = useRuntimeConfig();
const snackbar = useGlobalSnackbar();
const tab = ref('history');

const {
  data: history,
  error,
  loading,
  refresh,
} = usePoll(() => monitorFetch<AlertEntry[]>('alerts'), 30_000);
const { data: overview } = usePoll(
  () => monitorFetch<AlertsOverview>('alerts/overview'),
  30_000,
);
const rules = ref<AlertRule[]>([]);
const rulesLoading = ref(false);
const loadRules = async () => {
  rulesLoading.value = true;
  try {
    rules.value = await monitorFetch<AlertRule[]>('alerts/rules');
  } catch (err) {
    snackbar.error(err);
  } finally {
    rulesLoading.value = false;
  }
};
loadRules();

const ruleFilter = ref<string | null>(null);
const severityFilter = ref<string | null>(null);
const statusFilter = ref<string | null>(null);
const filtered = computed(() =>
  (history.value ?? []).filter(
    (entry) =>
      (!ruleFilter.value || entry.ruleId === ruleFilter.value) &&
      (!severityFilter.value || entry.severity === severityFilter.value) &&
      (!statusFilter.value || entry.emailStatus === statusFilter.value),
  ),
);
const ruleLabel = (id: string) =>
  rules.value.find((rule) => rule.id === id)?.label ?? id;

const expanded = ref<string[]>([]);
const headers = [
  { title: 'Waktu', key: 'time' },
  { title: 'Aturan', key: 'ruleId' },
  { title: 'Judul', key: 'title' },
  { title: 'Severity', key: 'severity' },
  { title: 'Email', key: 'emailStatus' },
  { title: '', key: 'data-table-expand' },
];

const saving = ref<string | null>(null);
const saveRule = async (rule: AlertRule) => {
  saving.value = rule.id;
  try {
    rules.value = await monitorFetch<AlertRule[]>(`alerts/rules/${rule.id}`, {
      method: 'PUT',
      body: {
        enabled: rule.enabled,
        cooldownMinutes: Number(rule.cooldownMinutes),
        ...(rule.threshold === null
          ? {}
          : { threshold: Number(rule.threshold) }),
      },
    });
    snackbar.success('Aturan disimpan.');
  } catch (err) {
    snackbar.error(err);
    await loadRules();
  } finally {
    saving.value = null;
  }
};
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Alerts"
      subtitle="Riwayat alert dan aturannya. Pengiriman email (SMTP, penerima, saklar) diatur di CMS Settings."
    >
      <template #actions>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-cog-outline"
          :href="`${config.public.cmsHost}/settings`"
          target="_blank"
          rel="noopener"
          >Email di CMS Settings</v-btn
        >
      </template>
    </CPageHeader>

    <v-alert
      v-if="overview && !overview.emailEnabled"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      Environment ini tidak mengirim email alert (hanya prod). Alert tetap
      dievaluasi dan dicatat di sini.
    </v-alert>
    <v-alert
      v-if="overview?.active.length"
      type="error"
      variant="tonal"
      class="mb-4"
      data-testid="active-alerts"
    >
      <div class="font-weight-bold mb-1">
        {{ overview.active.length }} alert belum pulih
      </div>
      <div v-for="item in overview.active" :key="item.key">
        {{ item.title }} (sejak {{ formatDateTime(item.since) }})
      </div>
    </v-alert>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>

    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="history">Riwayat</v-tab>
        <v-tab value="rules">Aturan</v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="tab">
        <v-window-item value="history">
          <div class="d-flex flex-wrap ga-2 pa-3 align-center">
            <v-select
              v-model="ruleFilter"
              :items="
                rules.map((rule) => ({ value: rule.id, title: rule.label }))
              "
              label="Aturan"
              clearable
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 260px"
            />
            <v-select
              v-model="severityFilter"
              :items="
                Object.entries(SEVERITY).map(([value, s]) => ({
                  value,
                  title: s.label,
                }))
              "
              label="Severity"
              clearable
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 180px"
            />
            <v-select
              v-model="statusFilter"
              :items="
                Object.entries(EMAIL_STATUS).map(([value, s]) => ({
                  value,
                  title: s.label,
                }))
              "
              label="Status email"
              clearable
              density="compact"
              hide-details
              variant="outlined"
              style="max-width: 240px"
            />
            <v-spacer />
            <span class="text-caption text-medium-emphasis">
              Outbox: {{ overview?.outboxSize ?? '-' }} · 24 jam:
              {{ overview?.last24h ?? '-' }}
            </span>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              :loading="loading"
              @click="refresh"
            />
          </div>
          <v-data-table
            v-model:expanded="expanded"
            :headers="headers"
            :items="filtered"
            item-value="id"
            show-expand
            density="compact"
            class="c-data-table"
            data-testid="alert-history"
          >
            <template #item.time="{ value }">{{
              formatDateTime(value)
            }}</template>
            <template #item.ruleId="{ value }">{{ ruleLabel(value) }}</template>
            <template #item.title="{ item }">
              <v-icon v-if="item.kind === 'resolved'" size="14" color="success"
                >mdi-check-circle</v-icon
              >
              <NuxtLink :to="item.link">{{ item.title }}</NuxtLink>
            </template>
            <template #item.severity="{ value }">
              <v-chip
                size="x-small"
                :color="SEVERITY[value as keyof typeof SEVERITY].color"
                variant="tonal"
                >{{ SEVERITY[value as keyof typeof SEVERITY].label }}</v-chip
              >
            </template>
            <template #item.emailStatus="{ item }">
              <v-chip
                size="x-small"
                :color="EMAIL_STATUS[item.emailStatus].color"
                variant="tonal"
                :title="item.emailError"
                >{{ EMAIL_STATUS[item.emailStatus].label
                }}{{
                  item.emailAttempts && item.emailAttempts > 1
                    ? ` (${item.emailAttempts}x)`
                    : ''
                }}</v-chip
              >
            </template>
            <template #expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="pa-3">
                  <div class="mb-1">{{ item.summary }}</div>
                  <div
                    v-if="item.emailError"
                    class="text-error text-caption mb-1"
                  >
                    Error email terakhir: {{ item.emailError }}
                  </div>
                  <pre v-if="item.details.length" class="alerts-details">{{
                    item.details.join('\n')
                  }}</pre>
                  <div class="text-caption text-medium-emphasis">
                    key {{ item.key }} · env {{ item.environment }}
                  </div>
                </td>
              </tr>
            </template>
          </v-data-table>
        </v-window-item>
        <v-window-item value="rules">
          <v-table
            density="compact"
            class="c-data-table"
            data-testid="alert-rules"
          >
            <thead>
              <tr>
                <th>Aktif</th>
                <th>Aturan</th>
                <th>Severity</th>
                <th>Ambang</th>
                <th>Cooldown (menit)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in rules" :key="rule.id">
                <td>
                  <v-switch
                    v-model="rule.enabled"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </td>
                <td>
                  <div class="font-weight-medium">{{ rule.label }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ rule.description }}
                  </div>
                </td>
                <td>
                  <v-chip
                    size="x-small"
                    :color="SEVERITY[rule.severity].color"
                    variant="tonal"
                    >{{ SEVERITY[rule.severity].label }}</v-chip
                  >
                </td>
                <td style="width: 170px">
                  <v-text-field
                    v-if="rule.threshold !== null"
                    v-model.number="rule.threshold"
                    type="number"
                    :suffix="rule.thresholdUnit ?? ''"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                  <span v-else class="text-medium-emphasis">-</span>
                </td>
                <td style="width: 130px">
                  <v-text-field
                    v-model.number="rule.cooldownMinutes"
                    type="number"
                    density="compact"
                    hide-details
                    variant="outlined"
                  />
                </td>
                <td>
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="primary"
                    :loading="saving === rule.id"
                    @click="saveRule(rule)"
                    >Simpan</v-btn
                  >
                </td>
              </tr>
            </tbody>
          </v-table>
          <p class="text-caption text-medium-emphasis pa-3">
            Aturan dengan status mengirim email "pulih" sekali saat kondisi
            normal lagi. Pengaturan email tidak ada di monitor; buka CMS
            Settings untuk SMTP, penerima, dan saklar email alert.
          </p>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>

<style scoped>
.alerts-details {
  font-size: 12px;
  background: #0f1720;
  color: #d7dde5;
  padding: 8px;
  border-radius: 6px;
  white-space: pre-wrap;
  margin-bottom: 4px;
}
</style>
