<script lang="ts" setup>
import type { RedisSlowlogEntry } from '@enem-landing/shared-types';
import { ref, watch } from 'vue';
import { useContainers } from '../composables/use-containers';
import { errorMessage, logsFetch } from '../composables/use-logs-api';
import { formatDateTime } from '../utils/log-format';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Redis' });

const tab = ref('container');
const { list: containers } = useContainers();
const slowlog = ref<RedisSlowlogEntry[]>([]);
const slowlogError = ref('');
const loading = ref(false);

const loadSlowlog = async () => {
  loading.value = true;
  try {
    slowlog.value = await logsFetch<RedisSlowlogEntry[]>('redis/slowlog', {
      limit: 128,
    });
    slowlogError.value = '';
  } catch (err) {
    slowlogError.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
};
watch(tab, (value) => value === 'slowlog' && loadSlowlog());

const headers = [
  { title: 'Waktu', key: 'time' },
  { title: 'Durasi', key: 'durationMicros' },
  { title: 'Perintah', key: 'command' },
  { title: 'Client', key: 'client' },
];
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Redis"
      subtitle="Redis self-host: log container dan SLOWLOG (dibaca dari memory Redis)."
    />
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="container">Container Redis</v-tab>
        <v-tab value="slowlog">Slowlog</v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="tab">
        <v-window-item value="container">
          <ContainerPanel
            :list="containers"
            category="redis"
            empty-text="Container Redis (stack redis) tidak ditemukan di server."
          />
        </v-window-item>
        <v-window-item value="slowlog">
          <v-alert
            v-if="slowlogError"
            type="error"
            variant="tonal"
            class="ma-3"
          >
            {{ slowlogError }}
          </v-alert>
          <v-data-table
            v-else
            :headers="headers"
            :items="slowlog"
            :loading="loading"
            density="compact"
            class="c-data-table"
          >
            <template #item.time="{ value }">{{
              formatDateTime(value)
            }}</template>
            <template #item.durationMicros="{ value }">
              {{ (value / 1000).toFixed(1) }} ms
            </template>
            <template #item.command="{ value }">
              <code>{{ value }}</code>
            </template>
          </v-data-table>
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>
