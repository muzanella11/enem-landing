<script lang="ts" setup>
import { ref } from 'vue';
import type { Experience } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Experiences' });

const { data: experiences, refresh } =
  await useFetch<Experience[]>('/api/experiences');
const snackbar = useGlobalSnackbar();
const router = useRouter();

const headers = [
  { title: 'Company', key: 'company' },
  { title: 'Position', key: 'position' },
  { title: 'Period', key: 'workingPeriode' },
  { title: 'Projects', key: 'projects' },
  { title: '', key: 'actions', sortable: false },
];

const dialog = ref(false);
const isSaving = ref(false);
const form = ref({
  company: '',
  position: '',
  location: '',
  description: '',
  roleSummary: '',
  workingPeriode: '',
  experienceGained: '',
});

const openCreate = () => {
  form.value = {
    company: '',
    position: '',
    location: '',
    description: '',
    roleSummary: '',
    workingPeriode: '',
    experienceGained: '',
  };
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    const body = {
      ...form.value,
      experienceGained: form.value.experienceGained
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const created = await $fetch<Experience>('/api/experiences', {
      method: 'post',
      body,
    });
    dialog.value = false;
    await refresh();
    snackbar.success('Experience created.');
    if (created?.id) {
      await router.push(`/experiences/${created.id}`);
    }
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (experience: Experience) => {
  try {
    await $fetch(`/api/experiences/${experience.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Experience deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <div>
  <CListPage title="Experiences" :meta="`${experiences?.length ?? 0} experience`">
    <template #actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate"
        >Add Experience</v-btn
      >
    </template>

    <v-data-table
      :headers="headers"
      :items="experiences ?? []"
      item-value="id"
      class="c-data-table"
    >
      <template #item.company="{ item }">
        <NuxtLink :to="`/experiences/${item.id}`" class="text-primary">{{
          item.company
        }}</NuxtLink>
      </template>
      <template #item.projects="{ item }">
        {{ item.projects?.length ?? 0 }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          :to="`/experiences/${item.id}`"
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
        />
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          size="small"
          color="error"
          @click="remove(item)"
        />
      </template>
    </v-data-table>
  </CListPage>

  <CModal v-model="dialog" title="Add Experience" max-width="640">
    <v-text-field
      v-model="form.company"
      label="Company"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-text-field
      v-model="form.position"
      label="Position"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-text-field
      v-model="form.location"
      label="Location"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-text-field
      v-model="form.workingPeriode"
      label="Period (e.g. Nov 2021 - Now)"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-textarea
      v-model="form.roleSummary"
      label="Role Summary"
      variant="outlined"
      density="compact"
      hide-details="auto"
      rows="2"
      class="mb-4"
    />
    <v-textarea
      v-model="form.description"
      label="Description"
      variant="outlined"
      density="compact"
      hide-details="auto"
      rows="3"
      class="mb-4"
    />
    <v-textarea
      v-model="form.experienceGained"
      label="Experience Gained (one per line)"
      variant="outlined"
      density="compact"
      hide-details="auto"
      rows="3"
    />

    <template #actions>
      <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" :loading="isSaving" @click="save">Save</v-btn>
    </template>
  </CModal>
  </div>
</template>
