<script setup lang="ts">
import {
  HARGA_BBM,
  HARGA_BBM_SUMBER,
  PRODUK_BBM,
  type ProdukBbm,
} from '~/data/bbm/harga';

/** Province + product picker that fills an editable price per litre (Story 50). */
const harga = defineModel<number>({ required: true });
const wilayah = ref('DKI Jakarta');
const produk = ref<ProdukBbm>('pertalite');
const tersedia = computed(() =>
  PRODUK_BBM.filter(
    (p) =>
      HARGA_BBM.find((w) => w.wilayah === wilayah.value)?.harga[p.id] != null,
  ),
);
const isi = () => {
  const nilai = HARGA_BBM.find((w) => w.wilayah === wilayah.value)?.harga[
    produk.value
  ];
  if (nilai != null) harga.value = nilai;
};
watch([wilayah, produk], isi);
onMounted(() => {
  if (!harga.value) isi();
});
watch(tersedia, (list) => {
  if (!list.some((p) => p.id === produk.value))
    produk.value = list[0]?.id ?? 'pertalite';
});
const berlaku = new Date(
  `${HARGA_BBM_SUMBER.berlaku}T00:00:00`,
).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <div>
      <label for="bbm-wilayah" class="field-label">Wilayah</label>
      <select id="bbm-wilayah" v-model="wilayah" class="field-input">
        <option v-for="w in HARGA_BBM" :key="w.wilayah" :value="w.wilayah">
          {{ w.wilayah }}
        </option>
      </select>
    </div>
    <div>
      <label for="bbm-produk" class="field-label">Jenis BBM</label>
      <select id="bbm-produk" v-model="produk" class="field-input">
        <option v-for="p in tersedia" :key="p.id" :value="p.id">
          {{ p.label }}
        </option>
      </select>
    </div>
    <RupiahInput
      id="bbm-harga"
      v-model="harga"
      label="Harga per liter"
      :hint="`Harga Pertamina berlaku ${berlaku}; bisa diubah.`"
    />
  </div>
</template>
