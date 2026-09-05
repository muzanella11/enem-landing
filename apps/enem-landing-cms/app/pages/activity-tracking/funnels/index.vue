<script lang="ts" setup>
import type { TrackingFunnel } from '@enem-landing/shared-types';
import { ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Activity Tracking Funnels' });

const { data: funnels, refresh } = await useFetch<TrackingFunnel[]>(
  '/api/tracking/funnels',
);
const snackbar = useGlobalSnackbar();

const showCreateModal = ref(false);
const isSaving = ref(false);
const deletingId = ref<string | null>(null);
const form = ref({ name: '', stepsText: '' });

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Steps', key: 'steps' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const parseSteps = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const openCreateModal = () => {
  form.value = { name: '', stepsText: '' };
  showCreateModal.value = true;
};

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
    await $fetch('/api/tracking/funnels', {
      method: 'post',
      body: { name: form.value.name, steps },
    });
    snackbar.success('Funnel created.');
    showCreateModal.value = false;
    await refresh();
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (id: string) => {
  deletingId.value = id;
  try {
    await $fetch(`/api/tracking/funnels/${id}`, { method: 'delete' });
    snackbar.success('Funnel deleted.');
    await refresh();
  } catch (err) {
    snackbar.error(err);
  } finally {
    deletingId.value = null;
  }
};
</script>

<template>
  <CListPage
    title="Funnels"
    subtitle="Lihat drop-off pengunjung antar step (pageview/event)."
    :meta="`${funnels?.length ?? 0} funnel`"
  >
    <template #actions>
      <v-btn
        to="/activity-tracking"
        variant="text"
        prepend-icon="mdi-arrow-left"
        >Overview</v-btn
      >
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openCreateModal"
        >New Funnel</v-btn
      >
    </template>

    <v-data-table :headers="headers" :items="funnels ?? []" item-value="id">
      <template #item.name="{ item }">
        <NuxtLink
          :to="`/activity-tracking/funnels/${item.id}`"
          class="font-weight-medium"
        >
          {{ item.name }}
        </NuxtLink>
      </template>
      <template #item.steps="{ item }">
        <span class="text-caption text-medium-emphasis">{{
          item.steps.join(' -> ')
        }}</span>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          size="small"
          variant="text"
          color="error"
          :loading="deletingId === item.id"
          @click="remove(item.id)"
          >Delete</v-btn
        >
      </template>
    </v-data-table>

    <CModal
      v-model="showCreateModal"
      title="New Funnel"
      icon="mdi-filter-variant"
    >
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
        label="Steps (satu per baris, minimal 2 - path pageview seperti '/' atau nama event seperti 'contact_click')"
        variant="outlined"
        density="compact"
        rows="5"
        hide-details
      />

      <template #actions>
        <v-btn variant="text" @click="showCreateModal = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save"
          >Create</v-btn
        >
      </template>
    </CModal>
  </CListPage>
</template>
