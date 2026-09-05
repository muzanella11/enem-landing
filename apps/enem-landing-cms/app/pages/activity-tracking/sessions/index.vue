<script lang="ts" setup>
import type { TrackingRecordingSession } from '@enem-landing/shared-types';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Sessions' });

const { data: sessions } = await useFetch<TrackingRecordingSession[]>(
  '/api/tracking/sessions',
);

const headers = [
  { title: 'Started At', key: 'startedAt' },
  { title: 'Device', key: 'deviceType' },
  { title: 'Browser', key: 'browserName' },
  { title: 'Pageviews', key: 'pageviewCount', align: 'end' as const },
  { title: 'Pages', key: 'paths' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];
</script>

<template>
  <CListPage
    title="Sessions"
    subtitle="Sesi pengunjung yang punya rekaman (session recording)."
    :meta="`${sessions?.length ?? 0} sesi`"
  >
    <template #actions>
      <v-btn
        to="/activity-tracking"
        variant="text"
        prepend-icon="mdi-arrow-left"
        >Overview</v-btn
      >
    </template>

    <v-data-table :headers="headers" :items="sessions ?? []" item-value="id">
      <template #item.startedAt="{ item }">
        {{ new Date(item.startedAt).toLocaleString() }}
      </template>
      <template #item.paths="{ item }">
        <span class="text-caption text-medium-emphasis">{{
          item.paths.join(', ')
        }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          :to="`/activity-tracking/sessions/${item.id}`"
          size="small"
          variant="text"
          color="primary"
          prepend-icon="mdi-play-circle-outline"
          >Replay</v-btn
        >
      </template>
    </v-data-table>
  </CListPage>
</template>
