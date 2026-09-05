<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Experience, Project } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const route = useRoute();
const id = route.params['id'] as string;

const { data: experience, refresh } = await useFetch<Experience>(
  `/api/experiences/${id}`,
);
const snackbar = useGlobalSnackbar();
useHead({
  title: computed(() => experience.value?.company ?? 'Experience'),
});

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

interface PendingImage {
  file: File;
  previewUrl: string;
}

const projectDialog = ref(false);
const isSavingProject = ref(false);
const editingProjectId = ref<string | null>(null);
const projectForm = ref({
  title: '',
  url: '',
  year: '',
  description: '',
  technologies: '',
});
// Already-uploaded images belonging to the project being edited (or created
// from a previous save attempt). Deleting one of these removes it from R2
// immediately - see removeExistingImage.
const projectImages = ref<string[]>([]);
// Freshly-selected files that haven't been uploaded yet - only previewed
// locally (object URLs) until Save is clicked, so cancelling the dialog
// never leaves an orphaned file in R2.
const pendingImages = ref<PendingImage[]>([]);

const clearPendingImages = () => {
  pendingImages.value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  pendingImages.value = [];
};

const openCreateProject = () => {
  editingProjectId.value = null;
  projectForm.value = {
    title: '',
    url: '',
    year: '',
    description: '',
    technologies: '',
  };
  projectImages.value = [];
  clearPendingImages();
  projectDialog.value = true;
};

const openEditProject = (project: Project) => {
  editingProjectId.value = project.id;
  projectForm.value = {
    title: project.title,
    url: project.url,
    year: project.year,
    description: project.description,
    technologies: project.technologies.join(', '),
  };
  projectImages.value = [...project.image];
  clearPendingImages();
  projectDialog.value = true;
};

const closeProjectDialog = () => {
  clearPendingImages();
  projectDialog.value = false;
};

const saveProject = async () => {
  isSavingProject.value = true;
  try {
    const uploadedUrls: string[] = [];
    for (const pending of pendingImages.value) {
      const formData = new FormData();
      formData.append('file', pending.file);
      formData.append('purpose', 'portfolio-project-image');
      const response = await $fetch<{ data: { url: string } }>('/api/uploads', {
        method: 'post',
        body: formData,
      });
      uploadedUrls.push(response.data.url);
    }

    const body = {
      title: projectForm.value.title,
      image: [...projectImages.value, ...uploadedUrls],
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
    clearPendingImages();
    projectDialog.value = false;
    await refresh();
    snackbar.success('Project saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSavingProject.value = false;
  }
};

const onSelectProjectImages = (files: File[] | File | null) => {
  const fileList = Array.isArray(files) ? files : files ? [files] : [];
  pendingImages.value.push(
    ...fileList.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    })),
  );
};

const removePendingImage = (index: number) => {
  const [removed] = pendingImages.value.splice(index, 1);
  if (removed) URL.revokeObjectURL(removed.previewUrl);
};

/**
 * The uploader keys each R2 object as `{app}/{purpose}/{uploadId}.{ext}` and
 * builds the public URL straight from that key, so the upload's own id is
 * recoverable from the URL - saves adding an id alongside every stored
 * image url just to support deletion.
 */
const extractUploadId = (url: string): string | null => {
  const filename = url.split('/').pop();
  if (!filename) return null;
  return filename.split('.')[0] || null;
};

const removeExistingImage = async (url: string) => {
  const uploadId = extractUploadId(url);
  if (uploadId) {
    try {
      await $fetch(`/api/uploads/${uploadId}`, { method: 'delete' });
    } catch (err) {
      const status = (err as { status?: number; statusCode?: number })?.status;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      // A 404 just means this URL wasn't one of our R2 uploads (e.g. a
      // manually-set image predating this feature) - nothing to reflect,
      // still fine to drop it from the project.
      if (status !== 404 && statusCode !== 404) {
        snackbar.error(err);
        return;
      }
    }
  }
  projectImages.value = projectImages.value.filter((u) => u !== url);
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

      <v-row>
        <v-col cols="12" md="9">
          <CContentCard title="Experience Details">
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
            />
          </CContentCard>
        </v-col>
        <v-col cols="12" md="3">
          <CContentCard title="Aksi">
            <v-btn
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              :loading="isSaving"
              block
              @click="saveExperience"
              >Save</v-btn
            >
          </CContentCard>
        </v-col>
      </v-row>

      <CContentCard title="Projects" class="mt-6">
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
      <v-file-input
        label="Upload Image(s)"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-2"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        prepend-icon=""
        prepend-inner-icon="mdi-image-plus-outline"
        :disabled="isSavingProject"
        @update:model-value="onSelectProjectImages"
      />
      <div
        v-if="projectImages.length || pendingImages.length"
        class="c-project-image-grid mb-4"
      >
        <div
          v-for="url in projectImages"
          :key="url"
          class="c-project-image-grid__item"
        >
          <v-img :src="url" aspect-ratio="1" cover rounded="lg" />
          <v-btn
            icon="mdi-close"
            size="x-small"
            color="error"
            class="c-project-image-grid__remove"
            :disabled="isSavingProject"
            @click="removeExistingImage(url)"
          />
        </div>
        <div
          v-for="(pending, index) in pendingImages"
          :key="pending.previewUrl"
          class="c-project-image-grid__item"
        >
          <v-img
            :src="pending.previewUrl"
            aspect-ratio="1"
            cover
            rounded="lg"
          />
          <v-chip size="x-small" class="c-project-image-grid__badge"
            >New</v-chip
          >
          <v-btn
            icon="mdi-close"
            size="x-small"
            color="error"
            class="c-project-image-grid__remove"
            :disabled="isSavingProject"
            @click="removePendingImage(index)"
          />
        </div>
      </div>
      <v-text-field
        v-model="projectForm.technologies"
        label="Technologies (comma-separated)"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />

      <template #actions>
        <v-btn
          variant="text"
          :disabled="isSavingProject"
          @click="closeProjectDialog"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          variant="flat"
          :loading="isSavingProject"
          @click="saveProject"
          >Save</v-btn
        >
      </template>
    </CModal>
  </div>
</template>

<style scoped>
.c-project-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 8px;
}

.c-project-image-grid__item {
  position: relative;
}

.c-project-image-grid__remove {
  position: absolute;
  top: 4px;
  right: 4px;
}

.c-project-image-grid__badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
}
</style>
