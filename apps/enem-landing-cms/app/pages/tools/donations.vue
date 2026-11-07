<script lang="ts" setup>
import type {
  DonationOption,
  DonationClickStats,
} from '@enem-landing/shared-types';
import { computed, ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Opsi Donasi' });

const PLATFORMS = [
  { value: 'sociabuzz', title: 'SociaBuzz' },
  { value: 'saweria', title: 'Saweria' },
  { value: 'trakteer', title: 'Trakteer' },
  { value: 'qris', title: 'QRIS statis' },
  { value: 'other', title: 'Lainnya' },
];

const { data: options, refresh } = await useFetch<DonationOption[]>(
  '/api/tools-admin/donation-options',
);
const { data: stats } = await useFetch<{ donations: DonationClickStats[] }>(
  '/api/tools-admin/stats',
);
const snackbar = useGlobalSnackbar();

const clicksById = computed(
  () =>
    new Map(
      (stats.value?.donations ?? []).map((row) => [row.donationOptionId, row]),
    ),
);

const headers = [
  { title: 'Label', key: 'label' },
  { title: 'Platform', key: 'platform' },
  { title: 'Tujuan', key: 'target', sortable: false },
  { title: 'Aktif', key: 'enabled', sortable: false },
  {
    title: 'Klik 30 hr',
    key: 'clicks',
    sortable: false,
    align: 'end' as const,
  },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const dialog = ref(false);
const isSaving = ref(false);
const isUploading = ref(false);
const editingId = ref<string | null>(null);
const emptyForm = () => ({
  label: 'SociaBuzz',
  platform: 'sociabuzz',
  url: '' as string | null,
  qrisImageUrl: '' as string | null,
  note: '' as string | null,
  enabled: true,
  sortOrder: options.value?.length ?? 0,
});
const form = ref(emptyForm());

const openCreate = () => {
  editingId.value = null;
  form.value = emptyForm();
  dialog.value = true;
};
const openEdit = (option: DonationOption) => {
  editingId.value = option.id;
  form.value = {
    label: option.label,
    platform: option.platform,
    url: option.url ?? '',
    qrisImageUrl: option.qrisImageUrl ?? '',
    note: option.note ?? '',
    enabled: option.enabled,
    sortOrder: option.sortOrder,
  };
  dialog.value = true;
};

const uploadQris = async (files: File | File[] | null) => {
  const file = Array.isArray(files) ? files[0] : files;
  if (!file) return;
  isUploading.value = true;
  try {
    const body = new FormData();
    body.append('file', file);
    body.append('purpose', 'tools-donation');
    const response = await $fetch<{ data: { url: string } }>('/api/uploads', {
      method: 'post',
      body,
    });
    form.value.qrisImageUrl = response.data.url;
  } catch (err) {
    snackbar.error(err);
  } finally {
    isUploading.value = false;
  }
};

const save = async () => {
  isSaving.value = true;
  const body = {
    ...form.value,
    url: form.value.url || null,
    qrisImageUrl: form.value.qrisImageUrl || null,
    note: form.value.note || null,
  };
  try {
    if (editingId.value) {
      await $fetch(`/api/tools-admin/donation-options/${editingId.value}`, {
        method: 'put',
        body,
      });
    } else {
      await $fetch('/api/tools-admin/donation-options', {
        method: 'post',
        body,
      });
    }
    dialog.value = false;
    await refresh();
    snackbar.success('Opsi donasi disimpan.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const toggle = async (option: DonationOption, enabled: boolean) => {
  try {
    await $fetch(`/api/tools-admin/donation-options/${option.id}`, {
      method: 'put',
      body: { enabled },
    });
    await refresh();
  } catch (err) {
    snackbar.error(err);
  }
};

const remove = async (option: DonationOption) => {
  try {
    await $fetch(`/api/tools-admin/donation-options/${option.id}`, {
      method: 'delete',
    });
    await refresh();
    snackbar.success('Opsi donasi dihapus.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <div>
    <CListPage
      title="Opsi Donasi"
      subtitle='Tautan "traktir kopi" di footer dan setelah hasil tool. Opsi tanpa URL atau gambar QRIS tidak ditampilkan.'
      :meta="`${options?.length ?? 0} opsi`"
    >
      <template #actions>
        <v-btn to="/tools" variant="text" prepend-icon="mdi-arrow-left"
          >Tools</v-btn
        >
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openCreate"
          >Tambah opsi</v-btn
        >
      </template>
      <v-data-table
        :headers="headers"
        :items="options ?? []"
        item-value="id"
        class="c-data-table"
      >
        <template #item.target="{ item }">
          <a v-if="item.url" :href="item.url" target="_blank" rel="noopener">{{
            item.url
          }}</a>
          <span v-else-if="item.qrisImageUrl">Gambar QRIS</span>
          <v-chip v-else size="small" color="warning"
            >Belum diisi, tidak tampil</v-chip
          >
        </template>
        <template #item.enabled="{ item }">
          <v-switch
            :model-value="item.enabled"
            color="primary"
            hide-details
            density="compact"
            @update:model-value="toggle(item, !!$event)"
          />
        </template>
        <template #item.clicks="{ item }">
          <span
            :title="
              (clicksById.get(item.id)?.byTool ?? [])
                .map((row) => `${row.toolId}: ${row.clicks}`)
                .join('\n')
            "
          >
            {{ clicksById.get(item.id)?.clicks ?? 0 }}
          </span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon="mdi-pencil-outline"
            variant="text"
            size="small"
            aria-label="Ubah"
            @click="openEdit(item)"
          />
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            size="small"
            color="error"
            aria-label="Hapus"
            @click="remove(item)"
          />
        </template>
      </v-data-table>
      <p class="text-caption text-medium-emphasis mt-2">
        Klik dihitung dari event donate_click di tools.muzanella.com. Jumlah
        donasi yang masuk ada di dashboard platform donasi.
      </p>
    </CListPage>

    <CModal
      v-model="dialog"
      :title="editingId ? 'Ubah opsi donasi' : 'Tambah opsi donasi'"
      max-width="560"
    >
      <v-text-field
        v-model="form.label"
        label="Label"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-select
        v-model="form.platform"
        :items="PLATFORMS"
        label="Platform"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />
      <v-text-field
        v-model="form.url"
        label="URL halaman donasi (https)"
        variant="outlined"
        density="compact"
        placeholder="https://sociabuzz.com/namamu/tribe"
        hide-details="auto"
        class="mb-4"
      />
      <v-file-input
        label="Gambar QRIS (opsional)"
        accept="image/png,image/jpeg,image/webp"
        variant="outlined"
        density="compact"
        prepend-icon="mdi-qrcode"
        :loading="isUploading"
        hide-details
        class="mb-2"
        @update:model-value="uploadQris"
      />
      <div v-if="form.qrisImageUrl" class="d-flex align-center ga-2 mb-4">
        <v-img :src="form.qrisImageUrl" alt="QRIS" height="64" width="64" />
        <v-btn
          size="small"
          variant="text"
          color="error"
          @click="form.qrisImageUrl = ''"
          >Hapus QRIS</v-btn
        >
      </div>
      <v-text-field
        v-model="form.note"
        label="Catatan kecil (opsional)"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model.number="form.sortOrder"
        type="number"
        label="Urutan"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />
      <v-switch
        v-model="form.enabled"
        label="Aktif"
        color="primary"
        hide-details
      />
      <template #actions>
        <v-btn variant="text" @click="dialog = false">Batal</v-btn>
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save"
          >Simpan</v-btn
        >
      </template>
    </CModal>
  </div>
</template>
