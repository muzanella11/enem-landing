<script lang="ts" setup>
import { ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });

interface SystemSettings {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL_BASE: string;
}

const { data: settingsResponse } = await useFetch<{ data: SystemSettings }>('/api/system-settings');
const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

// The saved secret is masked by this UI, not by the API - never render the
// real value back into the DOM. An untouched masked field is skipped on
// save so it doesn't overwrite the stored secret with dots.
const MASK = '••••••••';
const savedSecret = settingsResponse.value?.data?.R2_SECRET_ACCESS_KEY ?? '';

const form = ref({
  R2_ACCESS_KEY_ID: settingsResponse.value?.data?.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: savedSecret ? MASK : '',
  R2_ENDPOINT: settingsResponse.value?.data?.R2_ENDPOINT ?? '',
  R2_BUCKET_NAME: settingsResponse.value?.data?.R2_BUCKET_NAME ?? '',
  R2_PUBLIC_URL_BASE: settingsResponse.value?.data?.R2_PUBLIC_URL_BASE ?? '',
});

const save = async () => {
  isSaving.value = true;
  try {
    const body = { ...form.value };
    if (body.R2_SECRET_ACCESS_KEY === MASK) {
      delete (body as Partial<typeof body>).R2_SECRET_ACCESS_KEY;
    }
    await $fetch('/api/system-settings', { method: 'put', body });
    snackbar.success('Settings saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <v-container>
    <h1 class="text-h5 font-weight-bold mb-4">Settings</h1>
    <p class="text-medium-emphasis mb-4">
      Kredensial Cloudflare R2 untuk fitur upload file di enem-landing-account-api.
    </p>

    <v-card max-width="560">
      <v-card-text>
        <v-text-field v-model="form.R2_ACCESS_KEY_ID" label="R2 Access Key ID" density="comfortable" />
        <v-text-field
          v-model="form.R2_SECRET_ACCESS_KEY"
          label="R2 Secret Access Key"
          type="password"
          density="comfortable"
          @focus="form.R2_SECRET_ACCESS_KEY === MASK && (form.R2_SECRET_ACCESS_KEY = '')"
        />
        <v-text-field v-model="form.R2_ENDPOINT" label="R2 Endpoint" density="comfortable" />
        <v-text-field v-model="form.R2_BUCKET_NAME" label="R2 Bucket Name" density="comfortable" />
        <v-text-field v-model="form.R2_PUBLIC_URL_BASE" label="R2 Public URL Base" density="comfortable" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" :loading="isSaving" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
