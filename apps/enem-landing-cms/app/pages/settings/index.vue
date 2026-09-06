<script lang="ts" setup>
import { ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Settings' });

interface SystemSettings {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL_BASE: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  SMTP_FROM_NAME: string;
  SMTP_FROM_EMAIL: string;
  ADMIN_NOTIFICATION_EMAIL: string;
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
const savedR2Secret = settingsResponse.value?.data?.R2_SECRET_ACCESS_KEY ?? '';
const savedSmtpPassword = settingsResponse.value?.data?.SMTP_PASSWORD ?? '';

const form = ref({
  R2_ACCESS_KEY_ID: settingsResponse.value?.data?.R2_ACCESS_KEY_ID ?? '',
  R2_SECRET_ACCESS_KEY: savedR2Secret ? MASK : '',
  R2_ENDPOINT: settingsResponse.value?.data?.R2_ENDPOINT ?? '',
  R2_BUCKET_NAME: settingsResponse.value?.data?.R2_BUCKET_NAME ?? '',
  R2_PUBLIC_URL_BASE: settingsResponse.value?.data?.R2_PUBLIC_URL_BASE ?? '',
  SMTP_HOST: settingsResponse.value?.data?.SMTP_HOST ?? '',
  SMTP_PORT: settingsResponse.value?.data?.SMTP_PORT ?? '587',
  SMTP_SECURE: settingsResponse.value?.data?.SMTP_SECURE === 'true',
  SMTP_USERNAME: settingsResponse.value?.data?.SMTP_USERNAME ?? '',
  SMTP_PASSWORD: savedSmtpPassword ? MASK : '',
  SMTP_FROM_NAME: settingsResponse.value?.data?.SMTP_FROM_NAME ?? '',
  SMTP_FROM_EMAIL: settingsResponse.value?.data?.SMTP_FROM_EMAIL ?? '',
  ADMIN_NOTIFICATION_EMAIL:
    settingsResponse.value?.data?.ADMIN_NOTIFICATION_EMAIL ?? '',
});

const save = async () => {
  isSaving.value = true;
  try {
    const body: Record<string, string> = {
      ...form.value,
      SMTP_SECURE: String(form.value.SMTP_SECURE),
    };
    if (body.R2_SECRET_ACCESS_KEY === MASK) delete body.R2_SECRET_ACCESS_KEY;
    if (body.SMTP_PASSWORD === MASK) delete body.SMTP_PASSWORD;
    await $fetch('/api/system-settings', { method: 'put', body });
    snackbar.success('Settings saved.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const isSendingTestEmail = ref(false);
const testEmailTo = ref('');

const sendTestEmail = async () => {
  isSendingTestEmail.value = true;
  try {
    const response = await $fetch<{ message: string }>('/api/email/test', {
      method: 'post',
      body: testEmailTo.value ? { to: testEmailTo.value } : {},
    });
    snackbar.success(response.message);
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSendingTestEmail.value = false;
  }
};
</script>

<template>
  <CFormPage
    title="Settings"
    subtitle="Kredensial Cloudflare R2 untuk fitur upload file, dan konfigurasi SMTP untuk email notifikasi/auto-reply contact form."
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
          form.R2_SECRET_ACCESS_KEY === MASK && (form.R2_SECRET_ACCESS_KEY = '')
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
      />
    </CContentCard>

    <CContentCard title="Email (SMTP)">
      <v-text-field
        v-model="form.SMTP_HOST"
        label="SMTP Host"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.SMTP_PORT"
        label="SMTP Port"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-switch
        v-model="form.SMTP_SECURE"
        label="Gunakan TLS/SSL (secure)"
        color="primary"
        hide-details
        class="mb-4"
      />
      <v-text-field
        v-model="form.SMTP_USERNAME"
        label="SMTP Username"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.SMTP_PASSWORD"
        label="SMTP Password"
        type="password"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
        @focus="form.SMTP_PASSWORD === MASK && (form.SMTP_PASSWORD = '')"
      />
      <v-text-field
        v-model="form.SMTP_FROM_NAME"
        label="From Name"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.SMTP_FROM_EMAIL"
        label="From Email"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.ADMIN_NOTIFICATION_EMAIL"
        label="Admin Notification Email(s)"
        hint="Pisahkan dengan koma untuk lebih dari satu penerima."
        persistent-hint
        variant="outlined"
        density="compact"
        class="mb-4"
      />

      <v-divider class="my-4" />

      <p class="text-body-2 text-medium-emphasis mb-3">
        Kirim email percobaan untuk memverifikasi konfigurasi SMTP di atas sudah
        tersimpan dan berfungsi (save dulu sebelum test).
      </p>
      <div class="d-flex ga-2">
        <v-text-field
          v-model="testEmailTo"
          label="Kirim ke (opsional, default: admin notification email)"
          variant="outlined"
          density="compact"
          hide-details="auto"
        />
        <v-btn
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-email-fast-outline"
          :loading="isSendingTestEmail"
          @click="sendTestEmail"
          >Kirim Email Test</v-btn
        >
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
