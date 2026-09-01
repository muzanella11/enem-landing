<script lang="ts" setup>
import { ref } from 'vue';
import type { Skill } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const { data: skills, refresh } = await useFetch<Skill[]>('/api/skills');
const snackbar = useGlobalSnackbar();

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Category', key: 'category' },
  { title: 'Level', key: 'level' },
  { title: 'Icon', key: 'icon' },
  { title: '', key: 'actions', sortable: false },
];

const dialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const form = ref({ name: '', category: '', level: '', icon: '' });

const openCreate = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = { name: '', category: '', level: '', icon: '' };
  dialog.value = true;
};

const openEdit = (skill: Skill) => {
  isEditing.value = true;
  editingId.value = skill.id;
  form.value = {
    name: skill.name,
    category: skill.category,
    level: skill.level ?? '',
    icon: skill.icon ?? '',
  };
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/skills/${editingId.value}`, {
        method: 'put',
        body: form.value,
      });
    } else {
      await $fetch('/api/skills', { method: 'post', body: form.value });
    }
    dialog.value = false;
    await refresh();
    snackbar.success('Skill saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (skill: Skill) => {
  try {
    await $fetch(`/api/skills/${skill.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Skill deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Skills</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate"
        >Add Skill</v-btn
      >
    </div>

    <v-data-table :headers="headers" :items="skills ?? []" item-value="id">
      <template #item.actions="{ item }">
        <v-btn
          icon="mdi-pencil"
          variant="text"
          size="small"
          @click="openEdit(item)"
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

    <v-dialog v-model="dialog" max-width="480">
      <v-card>
        <v-card-title>{{ isEditing ? 'Edit' : 'Add' }} Skill</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Name"
            density="comfortable"
          />
          <v-text-field
            v-model="form.category"
            label="Category"
            density="comfortable"
          />
          <v-text-field
            v-model="form.level"
            label="Level"
            density="comfortable"
          />
          <v-text-field
            v-model="form.icon"
            label="Icon"
            density="comfortable"
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
