<script lang="ts" setup>
import type {
  TrackingFunnel,
  TrackingFunnelReportStep,
} from '@enem-landing/shared-types';
import { computed, ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const funnelId = route.params['id'] as string;

const { data: funnels } = await useFetch<TrackingFunnel[]>(
  '/api/tracking/funnels',
);
const funnel = computed(() =>
  funnels.value?.find((item) => item.id === funnelId),
);
useHead({ title: () => funnel.value?.name ?? 'Funnel' });

const { data: report, refresh: refreshReport } = await useFetch<
  TrackingFunnelReportStep[]
>(`/api/tracking/funnels/${funnelId}/report`);

const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

const form = ref({
  name: funnel.value?.name ?? '',
  stepsText: funnel.value?.steps.join('\n') ?? '',
});

const parseSteps = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const reportItems = computed(
  () =>
    report.value?.map((row) => ({ label: row.step, value: row.count })) ?? [],
);

const save = async () => {
  const steps = parseSteps(form.value.stepsText);
  if (!form.value.name || steps.length < 2) {
    snackbar.error(
      new Error('Nama funnel dan minimal 2 step (satu per baris) wajib diisi.'),
    );
    return;
  }

  isSaving.value = true;
  try {
    await $fetch(`/api/tracking/funnels/${funnelId}`, {
      method: 'put',
      body: { name: form.value.name, steps },
    });
    snackbar.success('Funnel saved.');
    await refreshReport();
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <CFormPage
    :title="funnel?.name ?? 'Funnel'"
    subtitle="Edit step dan lihat drop-off report."
  >
    <template #actions>
      <v-btn
        to="/activity-tracking/funnels"
        variant="text"
        prepend-icon="mdi-arrow-left"
        >Funnels</v-btn
      >
    </template>

    <CContentCard title="Steps">
      <v-text-field
        v-model="form.name"
        label="Funnel Name"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-textarea
        v-model="form.stepsText"
        label="Steps (satu per baris, minimal 2)"
        variant="outlined"
        density="compact"
        rows="5"
        hide-details
      />
    </CContentCard>

    <CContentCard title="Drop-off Report" class="mt-6">
      <CBarList :items="reportItems" empty-text="Belum ada data funnel." />
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
