<script lang="ts" setup>
import { ref } from 'vue';
import type { SiteProfile } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

const { data: profile } = await useFetch<SiteProfile>('/api/site-profile');
const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

const form = ref<SiteProfile>({
  heroTitle: profile.value?.heroTitle ?? '',
  heroSubtitle: profile.value?.heroSubtitle ?? '',
  bio: profile.value?.bio ?? '',
  avatarUrl: profile.value?.avatarUrl ?? '',
  socialLinks: profile.value?.socialLinks ?? [],
});

const addSocialLink = () => {
  form.value.socialLinks.push({ platform: '', url: '' });
};

const removeSocialLink = (index: number) => {
  form.value.socialLinks.splice(index, 1);
};

const save = async () => {
  isSaving.value = true;
  try {
    await $fetch('/api/site-profile', { method: 'put', body: form.value });
    snackbar.success('Site profile saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <v-container>
    <h1 class="text-h5 font-weight-bold mb-4">Site Profile</h1>

    <v-card max-width="640">
      <v-card-text>
        <v-text-field v-model="form.heroTitle" label="Hero Title" density="comfortable" />
        <v-text-field v-model="form.heroSubtitle" label="Hero Subtitle" density="comfortable" />
        <v-textarea v-model="form.bio" label="Bio" density="comfortable" rows="4" />
        <v-text-field v-model="form.avatarUrl" label="Avatar URL" density="comfortable" />

        <div class="d-flex align-center mt-2 mb-2">
          <span class="text-subtitle-2">Social Links</span>
          <v-spacer />
          <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="addSocialLink">Add</v-btn>
        </div>

        <div v-for="(link, index) in form.socialLinks" :key="index" class="d-flex align-center mb-2 ga-2">
          <v-text-field v-model="link.platform" label="Platform" density="compact" hide-details />
          <v-text-field v-model="link.url" label="URL" density="compact" hide-details />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeSocialLink(index)" />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="isSaving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
