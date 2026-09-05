<script lang="ts" setup>
import { ref } from 'vue';
import type { SeoMeta } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'SEO Meta' });

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
  <div>
  <CListPage title="SEO Meta" :meta="`${seoMetas?.length ?? 0} page`">
    <template #actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate"
        >Add Page</v-btn
      >
    </template>

    <v-data-table
      :headers="headers"
      :items="seoMetas ?? []"
      item-value="pageKey"
      class="c-data-table"
    >
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-pencil-outline"
          variant="text"
          size="small"
          @click="openEdit(item)"
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

  <CModal
    v-model="dialog"
    :title="`${isEditing ? 'Edit' : 'Add'} SEO Meta`"
    max-width="560"
  >
    <v-text-field
      v-model="form.pageKey"
      label="Page Key"
      variant="outlined"
      density="compact"
      hide-details="auto"
      :disabled="isEditing"
      class="mb-4"
    />
    <v-text-field
      v-model="form.title"
      label="Title"
      variant="outlined"
      density="compact"
      hide-details="auto"
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
    <v-text-field
      v-model="form.ogImageUrl"
      label="OG Image URL"
      variant="outlined"
      density="compact"
      hide-details="auto"
    />

    <template #actions>
      <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" :loading="isSaving" @click="save">Save</v-btn>
    </template>
  </CModal>
  </div>
</template>
