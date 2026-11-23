<script lang="ts" setup>
import type {
  DeployOverview,
  DeployServiceVersion,
} from '@enem-landing/shared-types';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import { formatAgo, formatDateTime } from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Deploy' });

const { data, error, loading, refresh } = usePoll(
  () => monitorFetch<DeployOverview>('deploy'),
  60_000,
);

const GITHUB = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
const commitUrl = (
  version: { source: string | null; revision: string | null } | null,
) =>
  version?.source && version.revision && GITHUB.test(version.source)
    ? `${version.source}/commit/${version.revision}`
    : null;
const short = (sha: string | null | undefined) => (sha ? sha.slice(0, 7) : '-');
const label = (version: DeployServiceVersion | null) => version?.version ?? '-';
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Deploy"
      subtitle="Versi yang jalan per service di prod dan dev (dari label OCI image), dan riwayat deploy. Read-only."
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

    <div class="d-flex flex-wrap ga-8 mb-4">
      <StatLine label="Versi prod" :value="data?.prodVersion" />
      <StatLine
        label="Deploy prod terakhir"
        :value="formatAgo(data?.lastDeploy.prod)"
      />
      <StatLine
        label="Deploy dev terakhir"
        :value="formatAgo(data?.lastDeploy.dev)"
      />
      <StatLine
        label="Service beda versi"
        :value="data?.differingServices"
        :tone="(data?.differingServices ?? 0) > 0 ? 'warning' : undefined"
      />
    </div>

    <CContentCard title="Service" no-padding class="mb-4">
      <v-table density="compact" class="c-data-table" data-testid="deploy-rows">
        <thead>
          <tr>
            <th>Service</th>
            <th>Prod</th>
            <th>Dev</th>
            <th>Beda</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data?.rows ?? []" :key="row.service">
            <td class="font-weight-medium">{{ row.service }}</td>
            <td v-for="env in ['prod', 'dev'] as const" :key="env">
              <template v-if="row[env]">
                <div>
                  {{ label(row[env]) }}
                  <a
                    v-if="commitUrl(row[env])"
                    :href="commitUrl(row[env]) as string"
                    target="_blank"
                    rel="noopener noreferrer"
                    ><code>{{ short(row[env]?.revision) }}</code></a
                  >
                </div>
                <div
                  class="text-caption text-medium-emphasis"
                  :title="formatDateTime(row[env]?.deployedAt)"
                >
                  deploy {{ formatAgo(row[env]?.deployedAt) }}
                </div>
              </template>
              <span v-else class="text-medium-emphasis">-</span>
            </td>
            <td>
              <template v-if="row.differs">
                <v-chip size="x-small" color="warning" variant="tonal"
                  >beda versi</v-chip
                >
                <a
                  v-if="row.compareUrl"
                  :href="row.compareUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-1 text-caption"
                  >compare</a
                >
              </template>
            </td>
          </tr>
        </tbody>
      </v-table>
    </CContentCard>

    <CContentCard title="Riwayat deploy" no-padding>
      <v-table
        density="compact"
        class="c-data-table"
        data-testid="deploy-history"
      >
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Service</th>
            <th>Env</th>
            <th>Versi</th>
            <th>Sebelumnya</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in data?.history ?? []"
            :key="`${entry.time}${entry.service}${entry.environment}`"
          >
            <td>{{ formatDateTime(entry.time) }}</td>
            <td>{{ entry.service }}</td>
            <td>{{ entry.environment }}</td>
            <td>
              {{ entry.version ?? '-' }}
              <code>{{ short(entry.revision) }}</code>
              <v-chip
                v-if="entry.rollback"
                size="x-small"
                color="error"
                variant="flat"
                class="ml-1"
                >rollback</v-chip
              >
            </td>
            <td class="text-medium-emphasis">
              {{ entry.previousVersion ?? '-' }}
              <code>{{ short(entry.previousRevision) }}</code>
            </td>
          </tr>
          <tr v-if="!data?.history.length">
            <td colspan="5" class="text-medium-emphasis">
              Belum ada perubahan versi tercatat (dicatat oleh monitor prod
              sejak label OCI ada).
            </td>
          </tr>
        </tbody>
      </v-table>
    </CContentCard>
  </div>
</template>
