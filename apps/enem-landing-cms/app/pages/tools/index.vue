<script lang="ts" setup>
import type {
  Tool,
  ToolUsageStats,
  DonationClickStats,
} from '@enem-landing/shared-types';
import { computed, ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Tools' });

const CATEGORIES = [
  { value: 'keuangan', title: 'Keuangan' },
  { value: 'dokumen', title: 'Dokumen' },
  { value: 'ibadah', title: 'Ibadah' },
  { value: 'kesehatan', title: 'Kesehatan' },
  { value: 'pendidikan', title: 'Pendidikan' },
];
const BADGES = [
  { value: null, title: 'Tanpa badge' },
  { value: 'baru', title: 'Baru' },
  { value: 'populer', title: 'Populer' },
];

const { data: tools, refresh } = await useFetch<Tool[]>(
  '/api/tools-admin/tools',
);
const { data: stats } = await useFetch<{
  usage: ToolUsageStats[];
  donations: DonationClickStats[];
}>('/api/tools-admin/stats');
const config = useRuntimeConfig();
const snackbar = useGlobalSnackbar();

const usageBySlug = computed(
  () => new Map((stats.value?.usage ?? []).map((row) => [row.toolId, row])),
);

const headers = [
  { title: '#', key: 'order', sortable: false, width: 90 },
  { title: 'Tool', key: 'name', sortable: false },
  { title: 'Kategori', key: 'category', sortable: false },
  { title: 'Aktif', key: 'enabled', sortable: false },
  { title: 'Iklan', key: 'adsEnabled', sortable: false },
  { title: 'View 30 hr', key: 'views', sortable: false, align: 'end' as const },
  {
    title: 'Hitung 30 hr',
    key: 'calculations',
    sortable: false,
    align: 'end' as const,
  },
  { title: 'Rasio', key: 'ratio', sortable: false, align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const ratio = (slug: string) => {
  const row = usageBySlug.value.get(slug);
  if (!row || row.views === 0) return '-';
  return `${Math.round((row.calculations / row.views) * 100)}%`;
};

const update = async (tool: Tool, patch: Partial<Tool>) => {
  try {
    await $fetch(`/api/tools-admin/tools/${tool.id}`, {
      method: 'put',
      body: patch,
    });
    await refresh();
    snackbar.success('Tool diperbarui.');
  } catch (err) {
    snackbar.error(err);
  }
};

const move = async (index: number, direction: -1 | 1) => {
  const list = [...(tools.value ?? [])];
  const target = index + direction;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target]!, list[index]!];
  try {
    await $fetch('/api/tools-admin/tools/reorder', {
      method: 'put',
      body: { ids: list.map((tool) => tool.id) },
    });
    await refresh();
  } catch (err) {
    snackbar.error(err);
  }
};

const dialog = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);
const emptyForm = () => ({
  slug: '',
  name: '',
  shortDescription: '',
  category: 'keuangan',
  badge: null as string | null,
  enabled: true,
  adsEnabled: true,
});
const form = ref(emptyForm());

const openCreate = () => {
  editingId.value = null;
  form.value = emptyForm();
  dialog.value = true;
};
const openEdit = (tool: Tool) => {
  editingId.value = tool.id;
  form.value = {
    slug: tool.slug,
    name: tool.name,
    shortDescription: tool.shortDescription,
    category: tool.category,
    badge: tool.badge,
    enabled: tool.enabled,
    adsEnabled: tool.adsEnabled,
  };
  dialog.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    if (editingId.value) {
      await $fetch(`/api/tools-admin/tools/${editingId.value}`, {
        method: 'put',
        body: form.value,
      });
    } else {
      await $fetch('/api/tools-admin/tools', {
        method: 'post',
        body: { ...form.value, sortOrder: tools.value?.length ?? 0 },
      });
    }
    dialog.value = false;
    await refresh();
    snackbar.success('Tool disimpan.');
  } catch (err) {
    snackbar.error(err);
  } finally {
    isSaving.value = false;
  }
};

const remove = async (tool: Tool) => {
  try {
    await $fetch(`/api/tools-admin/tools/${tool.id}`, { method: 'delete' });
    await refresh();
    snackbar.success('Tool dihapus dari registry.');
  } catch (err) {
    snackbar.error(err);
  }
};
</script>

<template>
  <div>
    <CListPage
      title="Tools"
      subtitle="Registry tools.muzanella.com: urutan, aktif/nonaktif, badge, dan iklan per tool. Perubahan tampil di situs dalam beberapa menit, tanpa deploy."
      :meta="`${tools?.length ?? 0} tool`"
    >
      <template #actions>
        <v-btn
          to="/tools/donations"
          variant="text"
          prepend-icon="mdi-coffee-outline"
          >Donasi</v-btn
        >
        <v-btn
          to="/tools/settings"
          variant="text"
          prepend-icon="mdi-cog-outline"
          >Pengaturan</v-btn
        >
        <v-btn
          to="/activity-tracking?site=tools"
          variant="text"
          prepend-icon="mdi-chart-line"
          >Tracking</v-btn
        >
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openCreate"
          >Tambah tool</v-btn
        >
      </template>

      <v-data-table
        :headers="headers"
        :items="tools ?? []"
        item-value="id"
        class="c-data-table"
        :items-per-page="-1"
        hide-default-footer
      >
        <template #item.order="{ index }">
          <v-btn
            icon="mdi-arrow-up"
            variant="text"
            size="x-small"
            :disabled="index === 0"
            aria-label="Naikkan"
            @click="move(index, -1)"
          />
          <v-btn
            icon="mdi-arrow-down"
            variant="text"
            size="x-small"
            :disabled="index === (tools?.length ?? 0) - 1"
            aria-label="Turunkan"
            @click="move(index, 1)"
          />
        </template>
        <template #item.name="{ item }">
          <div class="py-2">
            <a
              :href="`${config.public.toolsHost}/${item.slug}`"
              target="_blank"
              rel="noopener"
              class="font-weight-medium"
              >{{ item.name }}</a
            >
            <v-chip
              v-if="item.badge"
              size="x-small"
              class="ml-2"
              color="primary"
              >{{ item.badge }}</v-chip
            >
            <div class="text-caption text-medium-emphasis">
              /{{ item.slug }}
            </div>
          </div>
        </template>
        <template #item.enabled="{ item }">
          <v-switch
            :model-value="item.enabled"
            color="primary"
            hide-details
            density="compact"
            :aria-label="`Aktifkan ${item.name}`"
            @update:model-value="update(item, { enabled: !!$event })"
          />
        </template>
        <template #item.adsEnabled="{ item }">
          <v-switch
            :model-value="item.adsEnabled"
            color="primary"
            hide-details
            density="compact"
            :aria-label="`Iklan di ${item.name}`"
            @update:model-value="update(item, { adsEnabled: !!$event })"
          />
        </template>
        <template #item.views="{ item }">{{
          usageBySlug.get(item.slug)?.views ?? 0
        }}</template>
        <template #item.calculations="{ item }">{{
          usageBySlug.get(item.slug)?.calculations ?? 0
        }}</template>
        <template #item.ratio="{ item }">{{ ratio(item.slug) }}</template>
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
        View dan hitung berasal dari event tracking site tools (tool_view,
        tool_calculate) 30 hari terakhir. Iklan hanya tampil bila saklar global
        di Pengaturan juga aktif.
      </p>
    </CListPage>

    <CModal
      v-model="dialog"
      :title="editingId ? 'Ubah tool' : 'Tambah tool'"
      max-width="560"
    >
      <v-text-field
        v-model="form.name"
        label="Nama"
        variant="outlined"
        density="compact"
        hide-details="auto"
        class="mb-4"
      />
      <v-text-field
        v-model="form.slug"
        label="Slug (route di tools app)"
        variant="outlined"
        density="compact"
        hint="Harus sama dengan halaman yang sudah ada di enem-landing-tools, mis. kalkulator-gaji-bersih."
        persistent-hint
        class="mb-4"
      />
      <v-textarea
        v-model="form.shortDescription"
        label="Deskripsi singkat"
        variant="outlined"
        density="compact"
        rows="2"
        hide-details="auto"
        class="mb-4"
      />
      <v-select
        v-model="form.category"
        :items="CATEGORIES"
        label="Kategori"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />
      <v-select
        v-model="form.badge"
        :items="BADGES"
        label="Badge"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />
      <v-switch
        v-model="form.enabled"
        label="Aktif (tampil di index dan sitemap)"
        color="primary"
        hide-details
      />
      <v-switch
        v-model="form.adsEnabled"
        label="Iklan di tool ini"
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
