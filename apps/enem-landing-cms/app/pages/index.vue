<script lang="ts" setup>
import type { TrackingOverview } from '@enem-landing/shared-types';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Dashboard' });

const links = [
  { title: 'Experiences', icon: 'mdi-briefcase-outline', url: '/experiences' },
  {
    title: 'Contact Submissions',
    icon: 'mdi-email-outline',
    url: '/contact-submissions',
  },
  { title: 'Site Profile', icon: 'mdi-account-outline', url: '/site-profile' },
  { title: 'SEO Meta', icon: 'mdi-magnify', url: '/seo-meta' },
  { title: 'Skills', icon: 'mdi-star-outline', url: '/skills' },
  { title: 'Cache', icon: 'mdi-memory', url: '/cache' },
  {
    title: 'Activity Tracking',
    icon: 'mdi-chart-line',
    url: '/activity-tracking',
  },
  { title: 'Settings', icon: 'mdi-cog-outline', url: '/settings' },
];

// A fresh install with no tracking data yet shows zeros; `overview` stays
// null (never throws into the page) if the request fails for any reason,
// every usage below falls back accordingly.
const { data: overview } = await useFetch<TrackingOverview>(
  '/api/tracking/overview',
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Dashboard"
      subtitle="Kelola konten enem-landing dari satu tempat."
    />

    <v-row class="mb-4" dense>
      <v-col cols="12" sm="4">
        <CContentCard title="Pageviews Today">
          <span class="text-h5 font-weight-bold">{{
            overview?.pageviewsToday ?? 0
          }}</span>
        </CContentCard>
      </v-col>
      <v-col cols="12" sm="4">
        <CContentCard title="Active Sessions">
          <span class="text-h5 font-weight-bold">{{
            overview?.activeSessions ?? 0
          }}</span>
        </CContentCard>
      </v-col>
      <v-col cols="12" sm="4">
        <CContentCard title="Top Country">
          <span class="text-h5 font-weight-bold">{{
            overview?.topCountry ?? '-'
          }}</span>
        </CContentCard>
      </v-col>
    </v-row>

    <v-row class="mb-4" dense>
      <v-col cols="12" md="7">
        <CContentCard title="Menu">
          <v-list nav density="compact">
            <v-list-item
              v-for="link in links"
              :key="link.url"
              :to="link.url"
              :prepend-icon="link.icon"
              :title="link.title"
              rounded="lg"
              color="primary"
            />
          </v-list>
        </CContentCard>
      </v-col>
      <v-col cols="12" md="5">
        <CContentCard title="Visitor Locations" meta="Activity Tracking">
          <CTrackingMap :locations="overview?.locations ?? []" height="280px" />
        </CContentCard>
      </v-col>
    </v-row>
  </div>
</template>
