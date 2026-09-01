<script lang="ts" setup>
import { ref } from 'vue';
import type { Experience } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

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
  <v-container>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Experiences</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate"
        >Add Experience</v-btn
      >
    </div>

    <v-data-table :headers="headers" :items="experiences ?? []" item-value="id">
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
          icon="mdi-pencil"
          variant="text"
          size="small"
        />
        <v-btn
          icon="mdi-delete"
          variant="text"
          size="small"
          color="error"
          @click="remove(item)"
        />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="640">
      <v-card>
        <v-card-title>Add Experience</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.company"
            label="Company"
            density="comfortable"
          />
          <v-text-field
            v-model="form.position"
            label="Position"
            density="comfortable"
          />
          <v-text-field
            v-model="form.location"
            label="Location"
            density="comfortable"
          />
          <v-text-field
            v-model="form.workingPeriode"
            label="Period (e.g. Nov 2021 - Now)"
            density="comfortable"
          />
          <v-textarea
            v-model="form.roleSummary"
            label="Role Summary"
            density="comfortable"
            rows="2"
          />
          <v-textarea
            v-model="form.description"
            label="Description"
            density="comfortable"
            rows="3"
          />
          <v-textarea
            v-model="form.experienceGained"
            label="Experience Gained (one per line)"
            density="comfortable"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="isSaving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
