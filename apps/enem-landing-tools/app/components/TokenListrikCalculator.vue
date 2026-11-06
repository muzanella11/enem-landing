<script setup lang="ts">
import { PERALATAN_PRESET, TARIF_LISTRIK } from '~/data/listrik/tarif';
import { formatRupiah } from '~/utils/format';
import {
  kwhBulanan,
  kwhDariNominal,
  nominalDariKwh,
  type Peralatan,
} from '~/utils/listrik';

const props = withDefaults(defineProps<{ nominalAwal?: number }>(), {
  nominalAwal: 100_000,
});
const SLUG = 'kalkulator-token-listrik';
const events = useToolEvents(SLUG);

const form = reactive({
  golonganId: 'r1-1300',
  nominal: props.nominalAwal,
  admin: 0,
  pajakDaerahPersen: TARIF_LISTRIK.pajakDaerahBawaanPersen as number,
  kwhTarget: 100,
});
const golongan = computed(() =>
  TARIF_LISTRIK.golongan.find((item) => item.id === form.golonganId)!,
);
const hasil = computed(() =>
  kwhDariNominal({
    golongan: golongan.value,
    nominal: form.nominal,
    admin: form.admin,
    pajakDaerahPersen: form.pajakDaerahPersen,
  }),
);
const nominalUntukTarget = computed(() =>
  nominalDariKwh(
    golongan.value,
    form.kwhTarget,
    form.admin,
    form.pajakDaerahPersen,
  ),
);

const peralatan = ref<Peralatan[]>(
  PERALATAN_PRESET.map((item) => ({ ...item })),
);
const pemakaian = computed(() => kwhBulanan(peralatan.value));
const tokenBertahan = computed(() =>
  pemakaian.value > 0
    ? Math.floor((hasil.value.kwh / pemakaian.value) * 30)
    : null,
);

let tracked = false;
watch(
  () => [form.nominal, form.golonganId],
  () => {
    if (!tracked) {
      tracked = true;
      events.calculate();
    }
  },
);
</script>

<template>
  <div class="space-y-6">
    <section class="card space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="golongan" class="field-label">Golongan/daya</label>
          <select id="golongan" v-model="form.golonganId" class="field-input">
            <option
              v-for="item in TARIF_LISTRIK.golongan"
              :key="item.id"
              :value="item.id"
            >
              {{ item.label }} · Rp{{
                item.rupiahPerKwh.toLocaleString('id-ID')
              }}/kWh
            </option>
          </select>
        </div>
        <RupiahInput
          id="nominal-token"
          v-model="form.nominal"
          label="Nominal token"
        />
        <RupiahInput
          id="admin-token"
          v-model="form.admin"
          label="Biaya admin (opsional)"
        />
        <div>
          <label for="pajak-daerah" class="field-label"
            >Pajak daerah PBJT/PPJ (%)</label
          >
          <input
            id="pajak-daerah"
            v-model.number="form.pajakDaerahPersen"
            type="number"
            min="0"
            max="10"
            step="0.1"
            class="field-input"
          />
          <p class="field-hint">
            Berbeda per daerah; lihat baris PPJ/PBJT di struk tokenmu.
          </p>
        </div>
      </div>
      <div aria-live="polite">
        <p class="text-sm text-slate-500">
          Token {{ formatRupiah(form.nominal) }} mendapat
        </p>
        <p class="tabular text-3xl font-bold text-teal-800">
          {{ hasil.kwh.toLocaleString('id-ID') }} kWh
        </p>
        <div class="tabular mt-2 max-w-md text-sm">
          <p class="result-row">
            <span>Biaya admin</span><span>{{ formatRupiah(hasil.admin) }}</span>
          </p>
          <p class="result-row">
            <span>Pajak daerah ({{ form.pajakDaerahPersen }}%)</span
            ><span>{{ formatRupiah(hasil.pajakDaerah) }}</span>
          </p>
          <p v-if="hasil.ppn" class="result-row">
            <span>PPN ({{ TARIF_LISTRIK.ppnPersen }}%)</span
            ><span>{{ formatRupiah(hasil.ppn) }}</span>
          </p>
          <p class="result-row">
            <span>Nilai listrik</span
            ><span>{{ formatRupiah(hasil.nilaiListrik) }}</span>
          </p>
          <p class="result-row font-semibold">
            <span>Harga efektif per kWh</span
            ><span>{{ formatRupiah(hasil.hargaEfektifPerKwh) }}</span>
          </p>
        </div>
      </div>
    </section>

    <section class="card space-y-3">
      <h2 class="font-semibold">Butuh berapa kWh?</h2>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label for="kwh-target" class="field-label">Jumlah kWh</label>
          <input
            id="kwh-target"
            v-model.number="form.kwhTarget"
            type="number"
            min="1"
            class="field-input w-32"
          />
        </div>
        <p class="pb-2">
          Perlu beli token sekitar
          <strong class="tabular">{{ formatRupiah(nominalUntukTarget) }}</strong
          >.
        </p>
      </div>
    </section>

    <section class="card space-y-3">
      <h2 class="font-semibold">Perkiraan pemakaian sebulan</h2>
      <div class="-mx-4 overflow-x-auto sm:mx-0">
        <table class="w-full min-w-[480px] text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="px-4 py-1 font-medium sm:px-1">Alat</th>
              <th class="px-1 py-1 font-medium">Watt</th>
              <th class="px-1 py-1 font-medium">Jam/hari</th>
              <th class="px-1 py-1 font-medium">Jumlah</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(alat, index) in peralatan" :key="index">
              <td class="px-4 py-1 sm:px-1">
                <input
                  v-model="alat.nama"
                  class="field-input py-1"
                  :aria-label="`Nama alat ${index + 1}`"
                />
              </td>
              <td class="px-1 py-1">
                <input
                  v-model.number="alat.watt"
                  type="number"
                  min="0"
                  class="field-input w-20 py-1"
                  :aria-label="`Watt ${alat.nama}`"
                />
              </td>
              <td class="px-1 py-1">
                <input
                  v-model.number="alat.jam"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  class="field-input w-20 py-1"
                  :aria-label="`Jam ${alat.nama}`"
                />
              </td>
              <td class="px-1 py-1">
                <input
                  v-model.number="alat.jumlah"
                  type="number"
                  min="0"
                  class="field-input w-16 py-1"
                  :aria-label="`Jumlah ${alat.nama}`"
                />
              </td>
              <td class="px-1 py-1">
                <button
                  type="button"
                  class="text-rose-700"
                  :aria-label="`Hapus ${alat.nama}`"
                  @click="peralatan.splice(index, 1)"
                >
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        type="button"
        class="btn-secondary"
        @click="
          peralatan.push({ nama: 'Alat lain', watt: 100, jam: 1, jumlah: 1 })
        "
      >
        Tambah alat
      </button>
      <p class="tabular">
        Sekitar <strong>{{ pemakaian.toLocaleString('id-ID') }} kWh</strong> per
        bulan<span v-if="tokenBertahan !== null"
          >, token di atas cukup untuk sekitar
          <strong>{{ tokenBertahan }} hari</strong></span
        >.
      </p>
    </section>
  </div>
</template>
