<script lang="ts" setup>
import { ref } from 'vue';
import type { SeoMeta } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const { data: seoMetas, refresh } = await useFetch<SeoMeta[]>('/api/seo-meta');
const snackbar = useGlobalSnackbar();

const headers = [
  { title: 'Page Key', key: 'pageKey' },
  { title: 'Title', key: 'title' },
  { title: 'Description', key: 'description' },
  { title: '', key: 'actions', sortable: false },
];

const dialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const form = ref({ pageKey: '', title: '', description: '', ogImageUrl: '' });

const openCreate = () => {
  isEditing.value = false;
  form.value = { pageKey: '', title: '', description: '', ogImageUrl: '' };
  dialog.value = true;
};

const openEdit = (meta: SeoMeta) => {
  isEditing.value = true;
  form.value = { ...meta };
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    await $fetch('/api/seo-meta', { method: 'post', body: form.value });
    dialog.value = false;
    await refresh();
    snackbar.success('SEO meta saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (meta: SeoMeta) => {
  try {
    await $fetch(`/api/seo-meta/${meta.pageKey}`, { method: 'delete' });
    await refresh();
    snackbar.success('SEO meta deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">SEO Meta</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Add Page</v-btn>
    </div>

    <v-data-table :headers="headers" :items="seoMetas ?? []" item-value="pageKey">
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" variant="text" size="small" @click="openEdit(item)" />
        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="remove(item)" />
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="560">
      <v-card>
        <v-card-title>{{ isEditing ? 'Edit' : 'Add' }} SEO Meta</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.pageKey" label="Page Key" density="comfortable" :disabled="isEditing" />
          <v-text-field v-model="form.title" label="Title" density="comfortable" />
          <v-textarea v-model="form.description" label="Description" density="comfortable" rows="3" />
          <v-text-field v-model="form.ogImageUrl" label="OG Image URL" density="comfortable" />
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
