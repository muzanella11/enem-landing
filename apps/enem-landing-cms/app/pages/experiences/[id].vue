<script lang="ts" setup>
import { ref } from 'vue';
import type { Experience, Project } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const id = route.params['id'] as string;

const { data: experience, refresh } = await useFetch<Experience>(
  `/api/experiences/${id}`,
);
const snackbar = useGlobalSnackbar();

const isSaving = ref(false);
const form = ref({
  company: experience.value?.company ?? '',
  position: experience.value?.position ?? '',
  location: experience.value?.location ?? '',
  description: experience.value?.description ?? '',
  roleSummary: experience.value?.roleSummary ?? '',
  workingPeriode: experience.value?.workingPeriode ?? '',
  experienceGained: (experience.value?.experienceGained ?? []).join('\n'),
});

const saveExperience = async () => {
  isSaving.value = true;
  try {
    const body = {
      ...form.value,
      experienceGained: form.value.experienceGained
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    await $fetch(`/api/experiences/${id}`, { method: 'put', body });
    await refresh();
    snackbar.success('Experience saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const projectDialog = ref(false);
const isSavingProject = ref(false);
const editingProjectId = ref<string | null>(null);
const projectForm = ref({
  title: '',
  image: '',
  url: '',
  year: '',
  description: '',
  technologies: '',
});

const openCreateProject = () => {
  editingProjectId.value = null;
  projectForm.value = {
    title: '',
    image: '',
    url: '',
    year: '',
    description: '',
    technologies: '',
  };
  projectDialog.value = true;
};

const openEditProject = (project: Project) => {
  editingProjectId.value = project.id;
  projectForm.value = {
    title: project.title,
    image: project.image.join('\n'),
    url: project.url,
    year: project.year,
    description: project.description,
    technologies: project.technologies.join(', '),
  };
  projectDialog.value = true;
};

const saveProject = async () => {
  isSavingProject.value = true;
  try {
    const body = {
      title: projectForm.value.title,
      image: projectForm.value.image
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      url: projectForm.value.url,
      year: projectForm.value.year,
      description: projectForm.value.description,
      technologies: projectForm.value.technologies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (editingProjectId.value) {
      await $fetch(`/api/projects/${editingProjectId.value}`, {
        method: 'put',
        body,
      });
    } else {
      await $fetch(`/api/experiences/${id}/projects`, { method: 'post', body });
    }
    projectDialog.value = false;
    await refresh();
    snackbar.success('Project saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSavingProject.value = false;
  }
};

const removeProject = async (project: Project) => {
  try {
    await $fetch(`/api/projects/${project.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Project deleted.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <div>
  <div class="c-form-page">
    <CPageHeader :title="experience?.company ?? 'Experience'">
      <template #actions>
        <v-btn to="/experiences" variant="text" prepend-icon="mdi-arrow-left"
          >Back</v-btn
        >
      </template>
    </CPageHeader>

    <CContentCard title="Experience Details" class="mb-6">
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
        label="Period"
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
        class="mb-4"
      />
      <div class="d-flex justify-end">
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveExperience"
          >Save</v-btn
        >
      </div>
    </CContentCard>

    <CContentCard title="Projects">
      <template #header-right>
        <v-btn
          variant="text"
          size="small"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateProject"
          >Add Project</v-btn
        >
      </template>

      <v-row>
        <v-col
          v-for="project in experience?.projects ?? []"
          :key="project.id"
          cols="12"
          md="6"
        >
          <v-card variant="outlined" rounded="lg">
            <v-card-title>{{ project.title }}</v-card-title>
            <v-card-subtitle>{{ project.year }}</v-card-subtitle>
            <v-card-text>
              <p class="text-body-2 mb-2">{{ project.description }}</p>
              <v-chip
                v-for="tech in project.technologies"
                :key="tech"
                size="x-small"
                class="mr-1 mb-1"
              >
                {{ tech }}
              </v-chip>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                @click="openEditProject(project)"
              />
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                @click="removeProject(project)"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </CContentCard>
  </div>

  <CModal
    v-model="projectDialog"
    :title="`${editingProjectId ? 'Edit' : 'Add'} Project`"
    max-width="560"
  >
    <v-text-field
      v-model="projectForm.title"
      label="Title"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-text-field
      v-model="projectForm.year"
      label="Year"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-text-field
      v-model="projectForm.url"
      label="URL"
      variant="outlined"
      density="compact"
      hide-details="auto"
      class="mb-4"
    />
    <v-textarea
      v-model="projectForm.description"
      label="Description"
      variant="outlined"
      density="compact"
      hide-details="auto"
      rows="3"
      class="mb-4"
    />
    <v-textarea
      v-model="projectForm.image"
      label="Image URLs (one per line)"
      variant="outlined"
      density="compact"
      hide-details="auto"
      rows="2"
      class="mb-4"
    />
    <v-text-field
      v-model="projectForm.technologies"
      label="Technologies (comma-separated)"
      variant="outlined"
      density="compact"
      hide-details="auto"
    />

    <template #actions>
      <v-btn variant="text" @click="projectDialog = false">Cancel</v-btn>
      <v-btn color="primary" variant="flat" :loading="isSavingProject" @click="saveProject"
        >Save</v-btn
      >
    </template>
  </CModal>
  </div>
</template>
