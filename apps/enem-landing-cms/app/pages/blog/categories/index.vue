<script lang="ts" setup>
import { ref } from 'vue';
import type { BlogCategory } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Blog Categories' });

const { data: categories, refresh } =
  await useFetch<BlogCategory[]>('/api/blog-categories');
const snackbar = useGlobalSnackbar();

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: '', key: 'actions', sortable: false },
];

const dialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const form = ref({ name: '', slug: '' });

const openCreate = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = { name: '', slug: '' };
  dialog.value = true;
};

const openEdit = (category: BlogCategory) => {
  isEditing.value = true;
  editingId.value = category.id;
  form.value = { name: category.name, slug: category.slug };
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/blog-categories/${editingId.value}`, {
        method: 'put',
        body: form.value,
      });
    } else {
      await $fetch('/api/blog-categories', {
        method: 'post',
        body: form.value,
      });
    }
    dialog.value = false;
    await refresh();
    snackbar.success('Category saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (category: BlogCategory) => {
  try {
    await $fetch(`/api/blog-categories/${category.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Category deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <div>
    <CListPage
      title="Blog Categories"
      :meta="`${categories?.length ?? 0} category`"
    >
      <template #actions>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openCreate"
          >Add Category</v-btn
        >
      </template>

      <v-data-table
        :headers="headers"
        :items="categories ?? []"
        item-value="id"
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
      :title="`${isEditing ? 'Edit' : 'Add'} Category`"
      max-width="480"
    >
      <v-text-field
        v-model="form.name"
        label="Name"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.slug"
        label="Slug (optional, auto-generated from name)"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />

      <template #actions>
        <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save"
          >Save</v-btn
        >
      </template>
    </CModal>
  </div>
</template>
