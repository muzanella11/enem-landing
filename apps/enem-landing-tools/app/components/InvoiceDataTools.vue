<script setup lang="ts">
const { exportToFile, importFromFile, saveError } = useInvoiceStore();
const importError = ref('');
const imported = ref(false);
const input = ref<HTMLInputElement | null>(null);

const onImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (!file) return;
  importError.value = '';
  try {
    await importFromFile(file);
    imported.value = true;
  } catch (error) {
    importError.value =
      error instanceof Error ? error.message : 'Gagal mengimpor.';
  }
};
</script>

<template>
  <div class="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
    <p class="text-slate-700">
      Data tersimpan di browser ini saja. Ekspor untuk cadangan atau untuk
      pindah ke perangkat lain.
    </p>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn-secondary" @click="exportToFile">
        Ekspor data (JSON)
      </button>
      <button type="button" class="btn-secondary" @click="input?.click()">
        Impor data
      </button>
      <input
        ref="input"
        type="file"
        accept="application/json,.json"
        class="hidden"
        @change="onImport"
      />
    </div>
    <p v-if="imported" class="text-primary">Data berhasil diimpor.</p>
    <p v-if="importError" class="text-rose-700">{{ importError }}</p>
    <p v-if="saveError" class="text-rose-700">{{ saveError }}</p>
  </div>
</template>
