<script lang="ts" setup>
import type { TrackingSettings } from '@enem-landing/shared-types';
import { ref, watch } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

import { useTrackingSite } from '../../composables/use-tracking-site';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Settings' });

const { siteQuery, withSite, isTools, siteLabel } = useTrackingSite();
const { data: settings } = await useFetch<TrackingSettings>(
  '/api/tracking/settings',
  { query: siteQuery },
);
const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

const toForm = (
  value: TrackingSettings | null | undefined,
): TrackingSettings => ({
  pageviewEnabled: value?.pageviewEnabled ?? false,
  eventsEnabled: value?.eventsEnabled ?? false,
  heatmapEnabled: value?.heatmapEnabled ?? false,
  sessionRecordingEnabled: value?.sessionRecordingEnabled ?? false,
  sessionRecordingSampleRatePct: value?.sessionRecordingSampleRatePct ?? 10,
});
const form = ref<TrackingSettings>(toForm(settings.value));
// Switching site refetches; reset the form to that site's values.
watch(settings, (value) => {
  form.value = toForm(value);
});

const save = async () => {
  isSaving.value = true;
  try {
    await $fetch('/api/tracking/settings', {
      method: 'put',
      query: siteQuery.value,
      body: isTools.value
        ? { ...form.value, sessionRecordingEnabled: false }
        : form.value,
    });
    snackbar.success('Activity tracking settings saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <CFormPage
    title="Activity Tracking Settings"
    :subtitle="`Aktifkan/nonaktifkan tiap fitur tracking di ${siteLabel} secara independen.`"
  >
    <template #actions>
      <CSiteSwitcher class="mr-2" />
      <v-btn
        :to="withSite('/activity-tracking')"
        variant="text"
        prepend-icon="mdi-arrow-left"
        >Overview</v-btn
      >
    </template>

    <CContentCard title="Fitur">
      <v-switch
        v-model="form.pageviewEnabled"
        label="Pageview & Device Analytics"
        color="primary"
        hide-details
        class="mb-2"
      />
      <v-switch
        v-model="form.eventsEnabled"
        label="Custom Event & Funnel Tracking"
        color="primary"
        hide-details
        class="mb-2"
      />
      <v-switch
        v-model="form.heatmapEnabled"
        label="Click Heatmap"
        color="primary"
        hide-details
        class="mb-2"
      />
      <v-switch
        v-model="form.sessionRecordingEnabled"
        label="Session Recording"
        color="primary"
        :disabled="isTools"
        :hint="
          isTools
            ? 'Dimatikan permanen demi privasi input pengguna tools.'
            : undefined
        "
        :persistent-hint="isTools"
        :hide-details="!isTools"
        class="mb-2"
      />
      <v-slider
        v-model="form.sessionRecordingSampleRatePct"
        label="Sample Rate"
        :disabled="isTools || !form.sessionRecordingEnabled"
        min="0"
        max="100"
        step="1"
        thumb-label
        hide-details
      >
        <template #append>
          <span class="text-body-2" style="width: 40px"
            >{{ form.sessionRecordingSampleRatePct }}%</span
          >
        </template>
      </v-slider>
    </CContentCard>

    <template #sidebar>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save-outline"
        :loading="isSaving"
        block
        @click="save"
        >Save</v-btn
      >
    </template>
  </CFormPage>
</template>
