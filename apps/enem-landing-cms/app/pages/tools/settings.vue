<script lang="ts" setup>
import type { ToolsSettings } from '@enem-landing/shared-types';
import { ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Pengaturan Tools' });

const { data: settings } = await useFetch<ToolsSettings>(
  '/api/tools-admin/settings',
);
const snackbar = useGlobalSnackbar();
const isSaving = ref(false);

const form = ref({
  adsEnabled: settings.value?.adsEnabled ?? false,
  adsenseClientId: settings.value?.adsenseClientId ?? '',
  donationCtaText: settings.value?.donationCtaText ?? 'Traktir kopi',
  blockedCategoriesNote: settings.value?.blockedCategoriesNote ?? '',
});

const save = async () => {
  isSaving.value = true;
  try {
    await $fetch('/api/tools-admin/settings', {
      method: 'put',
      body: {
        ...form.value,
        adsenseClientId: form.value.adsenseClientId || null,
        blockedCategoriesNote: form.value.blockedCategoriesNote || null,
      },
    });
    snackbar.success('Pengaturan tools disimpan.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <CFormPage
    title="Pengaturan Tools"
    subtitle="Iklan dan teks donasi untuk tools.muzanella.com."
  >
    <template #actions>
      <v-btn to="/tools" variant="text" prepend-icon="mdi-arrow-left"
        >Tools</v-btn
      >
    </template>

    <CContentCard title="Iklan (Google AdSense)">
      <v-switch
        v-model="form.adsEnabled"
        label="Aktifkan iklan (saklar global)"
        color="primary"
        hint="Iklan tampil di sebuah tool hanya bila saklar ini DAN saklar iklan tool itu aktif, dan publisher ID terisi."
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.adsenseClientId"
        label="AdSense publisher ID"
        placeholder="ca-pub-XXXXXXXXXXXXXXXX"
        variant="outlined"
        density="compact"
        hint="ID slot iklan diatur lewat env NUXT_PUBLIC_ADSENSE_SLOT_* di enem-landing-tools."
        persistent-hint
        class="mb-4"
      />
      <v-textarea
        v-model="form.blockedCategoriesNote"
        label="Catatan kategori iklan yang diblokir"
        variant="outlined"
        density="compact"
        rows="3"
        hint="Pengingat internal; blokir kategorinya tetap dilakukan di dashboard AdSense."
        persistent-hint
      />
    </CContentCard>

    <CContentCard title="Donasi" class="mt-4">
      <v-text-field
        v-model="form.donationCtaText"
        label="Teks ajakan"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-2"
      />
      <v-btn
        to="/tools/donations"
        variant="text"
        prepend-icon="mdi-coffee-outline"
        >Kelola opsi donasi</v-btn
      >
    </CContentCard>

    <template #sidebar>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-content-save-outline"
        :loading="isSaving"
        block
        @click="save"
        >Simpan</v-btn
      >
    </template>
  </CFormPage>
</template>
