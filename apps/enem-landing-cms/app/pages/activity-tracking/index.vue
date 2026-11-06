<script lang="ts" setup>
import type { TrackingOverview } from '@enem-landing/shared-types';
import { computed } from 'vue';

import { useTrackingSite } from '../../composables/use-tracking-site';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Overview' });

const { siteQuery, withSite, isTools, siteLabel } = useTrackingSite();
const { data: overview } = await useFetch<TrackingOverview>(
  '/api/tracking/overview',
  { query: siteQuery },
);

const pageviewsByDayItems = computed(
  () =>
    overview.value?.pageviewsByDay.map((row) => ({
      label: row.date,
      value: row.count,
    })) ?? [],
);
const topPathsItems = computed(
  () =>
    overview.value?.topPaths.map((row) => ({
      label: row.path,
      value: row.count,
    })) ?? [],
);
const topReferrersItems = computed(
  () =>
    overview.value?.topReferrers.map((row) => ({
      label: row.referrer,
      value: row.count,
    })) ?? [],
);
const deviceItems = computed(
  () =>
    overview.value?.devices.map((row) => ({
      label: row.device,
      value: row.count,
    })) ?? [],
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Activity Tracking Overview"
      :subtitle="`Ringkasan pageview, sesi, dan sebaran lokasi pengunjung ${siteLabel}.`"
    >
      <template #actions>
        <CSiteSwitcher class="mr-2" />
        <v-btn
          v-if="!isTools"
          to="/activity-tracking/sessions"
          variant="text"
          prepend-icon="mdi-play-circle-outline"
          >Sessions</v-btn
        >
        <v-btn
          :to="withSite('/activity-tracking/heatmap')"
          variant="text"
          prepend-icon="mdi-fire"
          >Heatmap</v-btn
        >
        <v-btn
          :to="withSite('/activity-tracking/funnels')"
          variant="text"
          prepend-icon="mdi-filter-variant"
          >Funnels</v-btn
        >
        <v-btn
          :to="withSite('/activity-tracking/settings')"
          variant="text"
          prepend-icon="mdi-cog-outline"
          >Settings</v-btn
        >
      </template>
    </CPageHeader>

    <v-row class="mb-4" dense>
      <v-col cols="12" sm="3">
        <CContentCard title="Pageviews Today">
          <span class="text-h5 font-weight-bold">{{
            overview?.pageviewsToday ?? 0
          }}</span>
        </CContentCard>
      </v-col>
      <v-col cols="12" sm="3">
        <CContentCard title="Active Sessions">
          <span class="text-h5 font-weight-bold">{{
            overview?.activeSessions ?? 0
          }}</span>
        </CContentCard>
      </v-col>
      <v-col cols="12" sm="3">
        <CContentCard title="Total Visitors">
          <span class="text-h5 font-weight-bold">{{
            overview?.totalVisitors ?? 0
          }}</span>
        </CContentCard>
      </v-col>
      <v-col cols="12" sm="3">
        <CContentCard title="Top Country">
          <span class="text-h5 font-weight-bold">{{
            overview?.topCountry ?? '-'
          }}</span>
        </CContentCard>
      </v-col>
    </v-row>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="8">
        <CContentCard title="Pageviews per Day">
          <CBarList :items="pageviewsByDayItems" />
        </CContentCard>
      </v-col>
      <v-col cols="12" md="4">
        <CContentCard title="Devices">
          <CBarList :items="deviceItems" />
        </CContentCard>
      </v-col>
    </v-row>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="6">
        <CContentCard title="Top Pages">
          <CBarList :items="topPathsItems" />
        </CContentCard>
      </v-col>
      <v-col cols="12" md="6">
        <CContentCard title="Top Referrers">
          <CBarList
            :items="topReferrersItems"
            empty-text="No referrer data yet."
          />
        </CContentCard>
      </v-col>
    </v-row>

    <CContentCard title="Visitor Locations">
      <template #header-right>
        <v-btn
          :to="withSite('/activity-tracking/visitors')"
          variant="text"
          size="small"
          prepend-icon="mdi-map-marker-radius-outline"
          >Detail</v-btn
        >
      </template>
      <CTrackingMap :locations="overview?.locations ?? []" height="360px" />
    </CContentCard>
  </div>
</template>
