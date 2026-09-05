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

const { data: settingsResponse } = await useFetch<{ data: SystemSettings }>(
  '/api/system-settings',
);
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
  <CFormPage
    title="Settings"
    subtitle="Kredensial Cloudflare R2 untuk fitur upload file di enem-landing-account-api."
    :content-cols="12"
  >
    <CContentCard title="Cloudflare R2">
      <v-text-field
        v-model="form.R2_ACCESS_KEY_ID"
        label="R2 Access Key ID"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.R2_SECRET_ACCESS_KEY"
        label="R2 Secret Access Key"
        type="password"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
        @focus="
          form.R2_SECRET_ACCESS_KEY === MASK &&
          (form.R2_SECRET_ACCESS_KEY = '')
        "
      />
      <v-text-field
        v-model="form.R2_ENDPOINT"
        label="R2 Endpoint"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.R2_BUCKET_NAME"
        label="R2 Bucket Name"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.R2_PUBLIC_URL_BASE"
        label="R2 Public URL Base"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <div class="d-flex justify-end">
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save"
          >Save</v-btn
        >
      </div>
    </CContentCard>
  </CFormPage>
</template>
