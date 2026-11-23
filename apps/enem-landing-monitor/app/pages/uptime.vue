<script lang="ts" setup>
import type { TlsCertStatus, UptimeOverview } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import { computed, ref } from 'vue';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import { formatAgo, formatDateTime, formatDuration } from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Uptime' });

const snackbar = useGlobalSnackbar();
const { data, error, loading, refresh } = usePoll(
  () => monitorFetch<UptimeOverview>('uptime'),
  60_000,
);
const selected = ref<string | null>(null);
const selectedTarget = computed(
  () =>
    data.value?.targets.find((target) => target.id === selected.value) ??
    data.value?.targets.find((target) => target.kind === 'site') ??
    data.value?.targets[0],
);

const refreshingTls = ref(false);
const refreshTls = async () => {
  refreshingTls.value = true;
  try {
    const certs = await monitorFetch<TlsCertStatus[]>('uptime/tls/refresh', {
      method: 'POST',
    });
    if (data.value) data.value = { ...data.value, tls: certs };
  } catch (err) {
    snackbar.error(err);
  } finally {
    refreshingTls.value = false;
  }
};

const backupAge = computed(() =>
  data.value?.backup?.lastSuccessAt
    ? (Date.now() - Date.parse(data.value.backup.lastSuccessAt)) / 3_600_000
    : null,
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Uptime"
      subtitle="Status situs dan API (dicek tiap menit), sertifikat TLS, dan backup MySQL. Target tetap di kode, tidak bisa diubah dari sini."
    >
      <template #actions>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refresh"
          >Muat ulang</v-btn
        >
      </template>
    </CPageHeader>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>

    <CContentCard title="Target" no-padding class="mb-4">
      <v-table
        density="compact"
        class="c-data-table"
        data-testid="uptime-targets"
      >
        <thead>
          <tr>
            <th>Status</th>
            <th>Target</th>
            <th>Uptime 24 jam</th>
            <th>Uptime 7 hari</th>
            <th>Latency</th>
            <th>Cek terakhir</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="target in data?.targets ?? []"
            :key="target.id"
            :class="{ 'uptime-row--active': target.id === selectedTarget?.id }"
            style="cursor: pointer"
            @click="selected = target.id"
          >
            <td>
              <v-chip
                size="x-small"
                variant="flat"
                :color="
                  target.up === null
                    ? 'grey'
                    : target.up
                      ? 'success'
                      : target.consecutiveFailures >= 3
                        ? 'error'
                        : 'warning'
                "
                >{{
                  target.up === null
                    ? 'belum dicek'
                    : target.up
                      ? 'naik'
                      : target.consecutiveFailures >= 3
                        ? 'turun'
                        : `gagal ${target.consecutiveFailures}x`
                }}</v-chip
              >
            </td>
            <td>
              <div class="font-weight-medium">{{ target.label }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ target.kind }}
              </div>
            </td>
            <td>
              {{ target.uptime24h === null ? '-' : `${target.uptime24h}%` }}
            </td>
            <td>
              {{ target.uptime7d === null ? '-' : `${target.uptime7d}%` }}
            </td>
            <td>
              {{
                target.lastLatencyMs === null
                  ? '-'
                  : `${target.lastLatencyMs} ms`
              }}
            </td>
            <td>{{ formatAgo(target.lastCheckedAt) }}</td>
            <td class="text-error text-caption">
              {{ target.up ? '' : target.lastError }}
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-if="selectedTarget" class="pa-4">
        <div class="text-subtitle-2 mb-1">
          Latency 24 jam: {{ selectedTarget.label }}
        </div>
        <LineChart
          :series="[{ label: 'Latency', points: selectedTarget.latency24h }]"
          unit=" ms"
          :height="140"
        />
      </div>
    </CContentCard>

    <v-row>
      <v-col cols="12" md="6">
        <CContentCard title="Sertifikat TLS" no-padding>
          <template #header-right>
            <v-btn
              size="small"
              variant="text"
              :loading="refreshingTls"
              @click="refreshTls"
              >Cek sekarang</v-btn
            >
          </template>
          <v-table density="compact" class="c-data-table" data-testid="tls">
            <tbody>
              <tr v-for="cert in data?.tls ?? []" :key="cert.host">
                <td>{{ cert.host }}</td>
                <td>
                  <span v-if="cert.error" class="text-error">{{
                    cert.error
                  }}</span>
                  <span
                    v-else
                    :class="{
                      'text-error font-weight-bold': (cert.daysLeft ?? 99) < 14,
                    }"
                  >
                    sisa {{ cert.daysLeft }} hari
                  </span>
                </td>
                <td class="text-caption">{{ formatDateTime(cert.validTo) }}</td>
              </tr>
              <tr v-if="!data?.tls.length">
                <td class="text-medium-emphasis">
                  Belum dicek (dicek sekali sehari; hanya prod dan dev).
                </td>
              </tr>
            </tbody>
          </v-table>
        </CContentCard>
      </v-col>
      <v-col cols="12" md="6">
        <CContentCard title="Backup MySQL" data-testid="backup">
          <template v-if="data?.backup?.available">
            <StatLine
              label="Backup sukses terakhir"
              :value="
                data.backup.lastSuccessAt
                  ? formatAgo(data.backup.lastSuccessAt)
                  : 'tidak ada (30 hari)'
              "
              :tone="backupAge === null || backupAge > 26 ? 'error' : 'success'"
            />
            <StatLine
              label="Gagal terakhir"
              :value="
                data.backup.lastFailureAt
                  ? formatAgo(data.backup.lastFailureAt)
                  : '-'
              "
              :tone="
                data.backup.lastRun && !data.backup.lastRun.ok
                  ? 'error'
                  : undefined
              "
            />
            <v-table density="compact" class="mt-2">
              <tbody>
                <tr v-for="run in data.backup.runs.slice(0, 7)" :key="run.time">
                  <td>{{ formatDateTime(run.time) }}</td>
                  <td>
                    <v-chip
                      size="x-small"
                      :color="run.ok ? 'success' : 'error'"
                      variant="tonal"
                      >{{ run.ok ? 'OK' : 'GAGAL' }}</v-chip
                    >
                  </td>
                  <td class="text-caption">{{ run.message }}</td>
                </tr>
              </tbody>
            </v-table>
          </template>
          <div v-else class="text-medium-emphasis">
            Tidak ada data dari journal mysql-backup.service di environment ini.
          </div>
        </CContentCard>
      </v-col>
    </v-row>

    <CContentCard title="Riwayat down" no-padding class="mt-4">
      <v-table density="compact" class="c-data-table" data-testid="incidents">
        <thead>
          <tr>
            <th>Target</th>
            <th>Mulai</th>
            <th>Selesai</th>
            <th>Lama</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="incident in data?.incidents ?? []"
            :key="`${incident.targetId}${incident.startedAt}`"
          >
            <td>{{ incident.label }}</td>
            <td>{{ formatDateTime(incident.startedAt) }}</td>
            <td>
              <v-chip
                v-if="!incident.endedAt"
                size="x-small"
                color="error"
                variant="flat"
                >masih down</v-chip
              >
              <template v-else>{{ formatDateTime(incident.endedAt) }}</template>
            </td>
            <td>{{ formatDuration(incident.durationSeconds) }}</td>
            <td class="text-caption">{{ incident.error }}</td>
          </tr>
          <tr v-if="!data?.incidents.length">
            <td colspan="5" class="text-medium-emphasis">
              Belum ada kejadian down.
            </td>
          </tr>
        </tbody>
      </v-table>
    </CContentCard>
  </div>
</template>

<style scoped>
.uptime-row--active {
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
