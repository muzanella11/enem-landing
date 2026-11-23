<script lang="ts" setup>
import type { KnownIp, SecuritySummary } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';
import { computed, ref, watch } from 'vue';
import { errorMessage } from '../composables/use-logs-api';
import { monitorFetch } from '../composables/use-monitor-api';
import { formatDateTime } from '../utils/log-format';

/**
 * Server > Keamanan dan Akses > Analisis. Read-only: blocking is
 * left to a manual `ufw` command shown per IP.
 */
const hours = ref<24 | 168>(24);
const summary = ref<SecuritySummary | null>(null);
const knownIps = ref<KnownIp[]>([]);
const loading = ref(false);
const error = ref('');
const snackbar = useGlobalSnackbar();

const load = async () => {
  loading.value = true;
  try {
    const [result, known] = await Promise.all([
      monitorFetch<SecuritySummary>('security/summary', {
        query: { hours: hours.value },
      }),
      monitorFetch<KnownIp[]>('security/known-ips'),
    ]);
    summary.value = result;
    knownIps.value = known;
    error.value = '';
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};
watch(hours, load, { immediate: true });

const dialog = ref(false);
const dialogIp = ref('');
const dialogLabel = ref('');
const markKnown = (ip: string) => {
  dialogIp.value = ip;
  dialogLabel.value = '';
  dialog.value = true;
};
const saveKnown = async () => {
  try {
    knownIps.value = await monitorFetch<KnownIp[]>(
      `security/known-ips/${dialogIp.value}`,
      { method: 'PUT', body: { label: dialogLabel.value || 'dikenal' } },
    );
    dialog.value = false;
    await load();
  } catch (err) {
    snackbar.error(err);
  }
};
const removeKnown = async (ip: string) => {
  try {
    knownIps.value = await monitorFetch<KnownIp[]>(`security/known-ips/${ip}`, {
      method: 'DELETE',
    });
    await load();
  } catch (err) {
    snackbar.error(err);
  }
};

const copy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    snackbar.success('Disalin');
  } catch {
    snackbar.error('Clipboard tidak tersedia');
  }
};

const newLogins = computed(
  () => summary.value?.logins.filter((login) => !login.known).length ?? 0,
);
</script>

<template>
  <div class="pa-4" data-testid="security-panel">
    <div class="d-flex align-center ga-4 mb-4 flex-wrap">
      <v-btn-toggle
        v-model="hours"
        mandatory
        density="compact"
        color="primary"
        variant="outlined"
      >
        <v-btn :value="24">24 jam</v-btn>
        <v-btn :value="168">7 hari</v-btn>
      </v-btn-toggle>
      <StatLine label="Login gagal" :value="summary?.failedTotal" />
      <StatLine label="IP penyerang unik" :value="summary?.uniqueIps" />
      <StatLine
        label="Login sukses dari IP baru"
        :value="summary ? newLogins : null"
        :tone="newLogins > 0 ? 'error' : undefined"
      />
      <v-spacer />
      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="loading"
        @click="load"
      />
    </div>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
      error
    }}</v-alert>
    <v-alert
      v-if="summary?.truncated"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      btmp terlalu besar untuk dibaca habis dalam batas waktu; angka bisa
      kurang.
    </v-alert>

    <div class="text-subtitle-2 mb-1">Login gagal per jam</div>
    <LineChart
      :series="[{ label: 'Login gagal', points: summary?.failedPerHour ?? [] }]"
      :hours="hours"
      :height="120"
      bars
    />

    <v-row class="mt-2">
      <v-col cols="12" lg="8">
        <div class="text-subtitle-2 mb-1">Top IP</div>
        <v-table density="compact" class="c-data-table" data-testid="top-ips">
          <thead>
            <tr>
              <th>IP</th>
              <th>Negara</th>
              <th>ASN</th>
              <th>Percobaan</th>
              <th>User terbanyak</th>
              <th>Terakhir</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in summary?.topIps ?? []" :key="row.ip">
              <td>
                <code>{{ row.ip }}</code>
              </td>
              <td>{{ row.country ?? '-' }}</td>
              <td class="text-caption">{{ row.asn ?? '-' }}</td>
              <td>{{ row.count }}</td>
              <td>{{ row.topUser }}</td>
              <td>{{ formatDateTime(row.lastSeen) }}</td>
              <td>
                <v-btn
                  size="x-small"
                  variant="text"
                  prepend-icon="mdi-content-copy"
                  :title="`ufw deny from ${row.ip}`"
                  @click="copy(`sudo ufw deny from ${row.ip}`)"
                  >ufw deny</v-btn
                >
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col cols="12" lg="4">
        <div class="text-subtitle-2 mb-1">Top username yang ditebak</div>
        <v-table density="compact" class="c-data-table">
          <tbody>
            <tr v-for="row in summary?.topUsers ?? []" :key="row.user">
              <td>
                <code>{{ row.user }}</code>
              </td>
              <td class="text-right">{{ row.count }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <div class="text-subtitle-2 mt-4 mb-1">Login sukses</div>
    <v-table density="compact" class="c-data-table" data-testid="logins">
      <thead>
        <tr>
          <th>Waktu</th>
          <th>User</th>
          <th>IP</th>
          <th>Metode</th>
          <th>Status IP</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="login in summary?.logins ?? []"
          :key="`${login.time}${login.ip}${login.user}`"
        >
          <td>{{ formatDateTime(login.time) }}</td>
          <td>
            <span
              :class="{ 'text-error font-weight-bold': login.user === 'root' }"
              >{{ login.user }}</span
            >
          </td>
          <td>
            <code>{{ login.ip }}</code>
          </td>
          <td>
            <v-chip
              size="x-small"
              :color="login.method === 'password' ? 'error' : undefined"
              variant="tonal"
              >{{ login.method }}</v-chip
            >
          </td>
          <td>
            <v-chip
              v-if="login.known"
              size="x-small"
              color="success"
              variant="tonal"
            >
              dikenal{{ login.knownLabel ? `: ${login.knownLabel}` : '' }}
            </v-chip>
            <v-chip v-else size="x-small" color="error" variant="flat"
              >IP baru</v-chip
            >
          </td>
          <td>
            <v-btn
              v-if="!login.known && login.ip"
              size="x-small"
              variant="text"
              @click="markKnown(login.ip)"
              >Tandai dikenal</v-btn
            >
          </td>
        </tr>
      </tbody>
    </v-table>

    <div class="text-subtitle-2 mt-4 mb-1">IP dikenal</div>
    <div class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="entry in knownIps"
        :key="entry.ip"
        closable
        size="small"
        :title="`Ditambahkan ${formatDateTime(entry.addedAt)}`"
        @click:close="removeKnown(entry.ip)"
      >
        {{ entry.ip }} · {{ entry.label }}
      </v-chip>
      <span v-if="!knownIps.length" class="text-caption text-medium-emphasis">
        Belum ada. IP yang login memakai key otomatis ditandai dikenal.
      </span>
    </div>

    <v-dialog v-model="dialog" max-width="400">
      <v-card :title="`Tandai ${dialogIp} sebagai dikenal`">
        <v-card-text>
          <v-text-field
            v-model="dialogLabel"
            label="Label (misalnya rumah, kantor)"
            variant="outlined"
            density="compact"
            maxlength="60"
            autofocus
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Batal</v-btn>
          <v-btn color="primary" variant="flat" @click="saveKnown"
            >Simpan</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
