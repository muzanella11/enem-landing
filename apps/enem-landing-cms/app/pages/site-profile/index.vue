<script lang="ts" setup>
import { ref } from 'vue';
import type { SiteProfile } from '@enem-landing/shared-types';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Site Profile' });

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
  <CFormPage title="Site Profile">
    <CContentCard title="Profile">
      <v-text-field
        v-model="form.heroTitle"
        label="Hero Title"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.heroSubtitle"
        label="Hero Subtitle"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-textarea
        v-model="form.bio"
        label="Bio"
        variant="outlined"
        density="compact"
        hide-details="auto"
        rows="4"
        class="mb-4"
      />
      <v-text-field
        v-model="form.avatarUrl"
        label="Avatar URL"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />

      <div class="d-flex align-center mt-2 mb-2">
        <span class="text-subtitle-2">Social Links</span>
        <v-spacer />
        <v-btn
          size="small"
          variant="text"
          color="primary"
          prepend-icon="mdi-plus"
          @click="addSocialLink"
          >Add</v-btn
        >
      </div>

      <div
        v-for="(link, index) in form.socialLinks"
        :key="index"
        class="d-flex align-center mb-2 ga-2"
      >
        <v-text-field
          v-model="link.platform"
          label="Platform"
          variant="outlined"
          density="compact"
          hide-details
        />
        <v-text-field
          v-model="link.url"
          label="URL"
          variant="outlined"
          density="compact"
          hide-details
        />
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          size="small"
          color="error"
          @click="removeSocialLink(index)"
        />
      </div>
    </CContentCard>

    <template #sidebar>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save-outline"
        :loading="isSaving"
        block
        @click="save"
        >Save</v-btn
      >
    </template>
  </CFormPage>
</template>
