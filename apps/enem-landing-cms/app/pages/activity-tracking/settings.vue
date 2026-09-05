<script lang="ts" setup>
import type { TrackingSettings } from '@enem-landing/shared-types';
import { ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Settings' });

const { data: settings } = await useFetch<TrackingSettings>(
  '/api/tracking/settings',
);
const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

const form = ref<TrackingSettings>({
  pageviewEnabled: settings.value?.pageviewEnabled ?? false,
  eventsEnabled: settings.value?.eventsEnabled ?? false,
  heatmapEnabled: settings.value?.heatmapEnabled ?? false,
  sessionRecordingEnabled: settings.value?.sessionRecordingEnabled ?? false,
  sessionRecordingSampleRatePct:
    settings.value?.sessionRecordingSampleRatePct ?? 10,
});

const save = async () => {
  isSaving.value = true;
  try {
    await $fetch('/api/tracking/settings', {
      method: 'put',
      body: form.value,
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
    subtitle="Aktifkan/nonaktifkan tiap fitur tracking di enem-landing-web secara independen."
  >
    <template #actions>
      <v-btn
        to="/activity-tracking"
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
        hide-details
        class="mb-2"
      />
      <v-slider
        v-model="form.sessionRecordingSampleRatePct"
        label="Sample Rate"
        :disabled="!form.sessionRecordingEnabled"
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
