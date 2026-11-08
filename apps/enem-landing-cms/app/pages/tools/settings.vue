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
  adsenseSlotResult: settings.value?.adsenseSlotResult ?? '',
  adsenseSlotSidebar: settings.value?.adsenseSlotSidebar ?? '',
  blogAdsEnabled: settings.value?.blogAdsEnabled ?? false,
  adsenseSlotArticle: settings.value?.adsenseSlotArticle ?? '',
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
        adsenseSlotResult: form.value.adsenseSlotResult || null,
        adsenseSlotSidebar: form.value.adsenseSlotSidebar || null,
        adsenseSlotArticle: form.value.adsenseSlotArticle || null,
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
    subtitle="Iklan untuk tools.muzanella.com dan blog muzanella.com, serta teks donasi."
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
        hint="Begitu terisi, tag verifikasi AdSense dan /ads.txt otomatis aktif di muzanella.com dan tools.muzanella.com, walaupun iklan masih mati."
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.adsenseSlotResult"
        label="ID slot iklan di bawah hasil"
        placeholder="1234567890"
        variant="outlined"
        density="compact"
        hint="Angka data-ad-slot dari ad unit AdSense. Kosong = slot tidak dirender."
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.adsenseSlotSidebar"
        label="ID slot iklan sidebar (desktop)"
        placeholder="1234567890"
        variant="outlined"
        density="compact"
        hint="Angka data-ad-slot dari ad unit AdSense. Kosong = slot tidak dirender."
        persistent-hint
        class="mb-4"
      />
      <v-switch
        v-model="form.blogAdsEnabled"
        label="Aktifkan iklan di artikel blog muzanella.com"
        color="primary"
        hint="Iklan blog tampil hanya bila saklar ini DAN saklar global aktif, publisher ID terisi, dan ID slot artikel terisi."
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.adsenseSlotArticle"
        label="ID slot iklan artikel blog"
        placeholder="1234567890"
        variant="outlined"
        density="compact"
        hint="Dipakai untuk dua posisi: di sela isi artikel dan di akhir artikel. Kosong = tidak ada iklan di blog."
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

    <CContentCard title="Urutan setup AdSense" class="mt-4">
      <ol class="text-body-2 pl-4">
        <li>
          Daftarkan muzanella.com di AdSense (subdomain tools ikut tercakup).
        </li>
        <li>
          Isi publisher ID di atas lalu simpan. Tag verifikasi dan /ads.txt
          langsung aktif.
        </li>
        <li>Minta review di AdSense dan tunggu persetujuan.</li>
        <li>
          Buat dan publikasikan pesan GDPR di AdSense &gt; Privasi &amp; pesan.
          Pesan ini hanya tampil untuk pengunjung dari EEA, Inggris, dan Swiss.
        </li>
        <li>
          Blokir kategori pinjol, judi, investasi bodong, dan kripto berisiko di
          AdSense.
        </li>
        <li>
          Buat ad unit (di bawah hasil, sidebar, artikel blog), isi ID slotnya
          di atas.
        </li>
        <li>
          Nyalakan saklar iklan global, atur saklar iklan per tool di halaman
          Tools, dan nyalakan saklar iklan blog bila perlu.
        </li>
      </ol>
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
