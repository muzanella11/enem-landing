<script lang="ts" setup>
import type {
  AlertsOverview,
  ContainerInfo,
  DeployOverview,
  HostMetrics,
  LogsSummary,
  MonitorOverview,
  MysqlSizes,
  MysqlStats,
  RedisSlowlogEntry,
  RedisStats,
  SecuritySummary,
  UptimeOverview,
} from '@enem-landing/shared-types';
import { computed, onMounted, ref } from 'vue';
import { useContainerMetrics } from '../composables/use-container-metrics';
import { useContainers } from '../composables/use-containers';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import { monitorFetch } from '../composables/use-monitor-api';
import { usePoll } from '../composables/use-poll';
import {
  formatAgo,
  formatBytes,
  formatPercent,
  isRecentStart,
  shortServiceName,
} from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Dashboard' });

const { data: overview } = await useFetch<MonitorOverview>('/api/overview');

const { list: containers, error: containersError } = useContainers();
const summary = ref<LogsSummary | null>(null);
const summaryError = ref('');
const slowlog = ref<RedisSlowlogEntry[] | null>(null);

const optional = <T,>(path: string, query?: Record<string, string | number>) =>
  usePoll<T | null>(
    () => monitorFetch<T>(path, { query }).catch(() => null),
    60_000,
  ).data;
const alerts = optional<AlertsOverview>('alerts/overview');
const uptime = optional<UptimeOverview>('uptime');
const deploy = optional<DeployOverview>('deploy');
const host = optional<HostMetrics>('metrics/host');
const mysqlStats = optional<MysqlStats>('db/stats');
const mysqlSizes = optional<MysqlSizes>('db/sizes');
const redisStats = optional<RedisStats>('redis/stats');
const security = optional<SecuritySummary>('security/summary', { hours: 24 });
const { data: containerMetrics } = useContainerMetrics();

const topMemory = computed(() => {
  const top = containerMetrics.value?.containers.find(
    (c) => c.category === 'apps-prod' || c.category === 'apps-dev',
  );
  return top
    ? `${shortServiceName(top.service, top.stack)} ${formatPercent(top.memoryPercent)}`
    : null;
});
const worstDisk = computed(() =>
  host.value?.disks.reduce<number | null>(
    (max, disk) => Math.max(max ?? 0, disk.percent),
    null,
  ),
);
const uptimeCounts = computed(() => {
  const targets = uptime.value?.targets ?? [];
  return {
    up: targets.filter((t) => t.up).length,
    down: targets.filter((t) => t.up === false).length,
  };
});
const slowestTarget = computed(
  () =>
    [...(uptime.value?.targets ?? [])]
      .filter((t) => t.lastLatencyMs !== null)
      .sort((a, b) => (b.lastLatencyMs ?? 0) - (a.lastLatencyMs ?? 0))[0],
);
const minCertDays = computed(() =>
  (uptime.value?.tls ?? []).reduce<number | null>(
    (min, cert) =>
      cert.daysLeft === null
        ? min
        : Math.min(min ?? cert.daysLeft, cert.daysLeft),
    null,
  ),
);
const newIpLogins = computed(
  () => security.value?.logins.filter((login) => !login.known).length ?? null,
);
const mysqlConnections = computed(() =>
  mysqlStats.value?.connected
    ? `${mysqlStats.value.threadsConnected} / ${mysqlStats.value.maxConnections}`
    : null,
);

onMounted(async () => {
  const [summaryResult, slowlogResult] = await Promise.allSettled([
    logsFetch<LogsSummary>('summary'),
    logsFetch<RedisSlowlogEntry[]>('redis/slowlog', { limit: 128 }),
  ]);
  if (summaryResult.status === 'fulfilled') summary.value = summaryResult.value;
  else summaryError.value = errorMessage(summaryResult.reason);
  if (slowlogResult.status === 'fulfilled') slowlog.value = slowlogResult.value;
});

const DAY_MS = 24 * 60 * 60 * 1000;
const running = (category: string) =>
  (containers.value?.running ?? []).filter((c) => c.category === category);
const findRunning = (category: string, service: string) =>
  running(category).find((c) => c.service.endsWith(service));

const recentCrashes = computed<ContainerInfo[]>(() =>
  (containers.value?.stopped ?? []).filter(
    (c) =>
      c.crashed &&
      c.finishedAt !== null &&
      Date.now() - Date.parse(c.finishedAt) < DAY_MS,
  ),
);
const appsRunning = computed(() => [
  ...running('apps-prod'),
  ...running('apps-dev'),
]);
const appsCrashedServices = computed(
  () => appsRunning.value.filter((c) => c.recentCrash).length,
);
const appsFreshStarts = computed(
  () => appsRunning.value.filter((c) => isRecentStart(c.startedAt)).length,
);
const mysql = computed(() => findRunning('db', 'mysql'));
const redis = computed(() => findRunning('redis', 'redis'));
const slowLogSize = computed(
  () =>
    summary.value?.sources.find((s) => s.id === 'mysql-slow')?.files[0]?.size,
);
const redisSlowLastDay = computed(
  () =>
    slowlog.value?.filter((e) => Date.now() - Date.parse(e.time) < DAY_MS)
      .length ?? null,
);

const serverStatus = computed(() => {
  if (!summary.value) return 'unknown';
  if ((summary.value.oomEvents ?? 0) > 0) return 'error';
  if ((worstDisk.value ?? 0) > 80 || (host.value?.memory.percent ?? 0) > 90)
    return 'warning';
  return 'ok';
});
const appsStatus = computed(() => {
  if (!containers.value) return 'unknown';
  if (appsCrashedServices.value > 0) return 'error';
  return appsFreshStarts.value > 0 ? 'warning' : 'ok';
});
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Dashboard"
      subtitle="Ringkasan kondisi server, database, Redis, dan app."
    />

    <v-alert
      v-if="overview && !overview.logsEnabled"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Pembacaan log nonaktif di environment ini (LOGS_ENABLED atau
      LOG_READER_TOKEN belum diset).
    </v-alert>
    <v-alert
      v-else-if="containersError || summaryError"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ containersError || summaryError }}
    </v-alert>

    <v-alert
      v-if="recentCrashes.length"
      type="error"
      variant="tonal"
      class="mb-4"
      data-testid="recent-crashes"
    >
      <div class="font-weight-bold mb-1">
        {{ recentCrashes.length }} container crash dalam 24 jam terakhir
      </div>
      <div v-for="container in recentCrashes.slice(0, 5)" :key="container.id">
        {{ container.service }}: exit {{ container.exitCode
        }}{{ container.oomKilled ? ' (OOMKilled)' : '' }},
        {{ formatAgo(container.finishedAt) }}
      </div>
    </v-alert>

    <v-row>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Server"
          icon="mdi-server-outline"
          to="/server"
          :status="serverStatus"
        >
          <StatLine
            label="Login gagal 24 jam"
            :value="summary?.failedLogins24h"
            :tone="
              (summary?.failedLogins24h ?? 0) > 1000 ? 'warning' : undefined
            "
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
          <StatLine
            label="RAM host"
            :value="formatPercent(host?.memory.percent)"
            :tone="(host?.memory.percent ?? 0) > 90 ? 'error' : undefined"
          />
          <StatLine
            label="Disk tertinggi"
            :value="formatPercent(worstDisk)"
            :tone="(worstDisk ?? 0) > 80 ? 'error' : undefined"
          />
          <StatLine
            label="IP penyerang unik 24 jam"
            :value="security?.uniqueIps"
          />
          <StatLine
            label="Login sukses dari IP baru"
            :value="newIpLogins"
            :tone="(newIpLogins ?? 0) > 0 ? 'error' : undefined"
          />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Apps"
          icon="mdi-application-brackets-outline"
          to="/apps"
          :status="appsStatus"
        >
          <StatLine
            label="Container prod aktif"
            :value="containers ? running('apps-prod').length : null"
          />
          <StatLine
            label="Container dev aktif"
            :value="containers ? running('apps-dev').length : null"
          />
          <StatLine
            label="Service dengan crash 24 jam"
            :value="containers ? appsCrashedServices : null"
            :tone="appsCrashedServices > 0 ? 'error' : undefined"
          />
          <StatLine
            label="Baru start (< 5 menit)"
            :value="containers ? appsFreshStarts : null"
            :tone="appsFreshStarts > 0 ? 'warning' : undefined"
          />
          <StatLine label="Memory tertinggi" :value="topMemory" />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="DB"
          icon="mdi-database-outline"
          to="/db"
          :status="containers ? (mysql ? 'ok' : 'error') : 'unknown'"
        >
          <StatLine
            label="MySQL"
            :value="containers ? (mysql ? 'Jalan' : 'Tidak jalan') : null"
            :tone="containers ? (mysql ? 'success' : 'error') : undefined"
          />
          <StatLine
            label="Start"
            :value="mysql ? formatAgo(mysql.startedAt) : '-'"
          />
          <StatLine label="Restart" :value="mysql?.restartCount" />
          <StatLine label="Slow query log" :value="formatBytes(slowLogSize)" />
          <StatLine label="Koneksi aktif" :value="mysqlConnections" />
          <StatLine
            label="Ukuran total"
            :value="formatBytes(mysqlSizes?.totalBytes)"
          />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <StatCard
          title="Redis"
          icon="mdi-memory"
          to="/redis"
          :status="
            overview ? (overview.redisConnected ? 'ok' : 'error') : 'unknown'
          "
        >
          <StatLine
            label="Koneksi"
            :value="
              overview
                ? overview.redisConnected
                  ? 'Terhubung'
                  : 'Gagal'
                : null
            "
            :tone="
              overview
                ? overview.redisConnected
                  ? 'success'
                  : 'error'
                : undefined
            "
          />
          <StatLine
            label="Start"
            :value="redis ? formatAgo(redis.startedAt) : '-'"
          />
          <StatLine label="Restart" :value="redis?.restartCount" />
          <StatLine label="Slowlog 24 jam" :value="redisSlowLastDay" />
          <StatLine
            label="Memory / maxmemory"
            :value="formatPercent(redisStats?.memoryPercent)"
            :tone="(redisStats?.memoryPercent ?? 0) > 85 ? 'error' : undefined"
          />
          <StatLine
            label="Hit rate"
            :value="formatPercent(redisStats?.hitRate)"
          />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <StatCard
          title="Alerts"
          icon="mdi-bell-outline"
          to="/alerts"
          :status="alerts ? (alerts.active.length ? 'error' : 'ok') : 'unknown'"
        >
          <StatLine label="Alert 24 jam" :value="alerts?.last24h" />
          <StatLine
            label="Belum pulih"
            :value="alerts?.active.length"
            :tone="(alerts?.active.length ?? 0) > 0 ? 'error' : undefined"
          />
          <StatLine
            label="Alert terakhir"
            :value="
              alerts?.latest
                ? `${alerts.latest.title} (${formatAgo(alerts.latest.time)})`
                : '-'
            "
          />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <StatCard
          title="Uptime"
          icon="mdi-heart-pulse"
          to="/uptime"
          :status="
            uptime ? (uptimeCounts.down > 0 ? 'error' : 'ok') : 'unknown'
          "
        >
          <StatLine
            label="Target naik / turun"
            :value="uptime ? `${uptimeCounts.up} / ${uptimeCounts.down}` : null"
            :tone="uptimeCounts.down > 0 ? 'error' : undefined"
          />
          <StatLine
            label="Latency tertinggi"
            :value="
              slowestTarget
                ? `${slowestTarget.label} ${slowestTarget.lastLatencyMs} ms`
                : '-'
            "
          />
          <StatLine
            label="Sertifikat tersisa"
            :value="minCertDays === null ? '-' : `${minCertDays} hari`"
            :tone="(minCertDays ?? 99) < 14 ? 'error' : undefined"
          />
          <StatLine
            label="Backup terakhir"
            :value="
              uptime?.backup?.lastSuccessAt
                ? formatAgo(uptime.backup.lastSuccessAt)
                : '-'
            "
          />
        </StatCard>
      </v-col>
      <v-col cols="12" sm="6" lg="4">
        <StatCard
          title="Deploy"
          icon="mdi-rocket-launch-outline"
          to="/deploy"
          :status="deploy ? 'ok' : 'unknown'"
        >
          <StatLine label="Versi prod" :value="deploy?.prodVersion" />
          <StatLine
            label="Deploy prod terakhir"
            :value="formatAgo(deploy?.lastDeploy.prod)"
          />
          <StatLine
            label="Deploy dev terakhir"
            :value="formatAgo(deploy?.lastDeploy.dev)"
          />
          <StatLine
            label="Service beda versi"
            :value="deploy?.differingServices"
            :tone="(deploy?.differingServices ?? 0) > 0 ? 'warning' : undefined"
          />
        </StatCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <CContentCard title="Ringkasan" meta="enem-landing-monitor-api">
          <div class="d-flex flex-wrap ga-6" data-testid="overview">
            <div>
              <div class="text-caption text-medium-emphasis">User</div>
              <div class="font-weight-medium">
                {{ overview?.user.fullname ?? '-' }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Environment</div>
              <div
                class="font-weight-medium"
                data-testid="overview-environment"
              >
                {{ overview?.environment ?? '-' }}
              </div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">
                Versi monitor-api
              </div>
              <div class="font-weight-medium">
                {{ overview?.version ?? '-' }}
              </div>
            </div>
          </div>
        </CContentCard>
      </v-col>
    </v-row>
  </div>
</template>
