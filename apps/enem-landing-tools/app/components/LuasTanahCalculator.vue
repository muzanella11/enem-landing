<script setup lang="ts">
import { KATEGORI, SATUAN_LOKAL } from '~/data/satuan';
import { bulatkan, luasPersegiPanjang, luasTrapesium } from '~/utils/satuan';

/** Land area converter (Story 40): every local variant is listed, never one "true" value. */
const props = withDefaults(defineProps<{ satuanAwal?: string }>(), {
  satuanAwal: 'm2',
});
const emit = defineEmits<{ hitung: [] }>();

interface Opsi {
  id: string;
  label: string;
  m2: number;
}
const metrik: Opsi[] = KATEGORI.find((k) => k.id === 'luas')!.satuan.map(
  (s) => ({ id: s.id, label: s.label, m2: s.faktor }),
);
const lokal: Opsi[] = SATUAN_LOKAL.filter(
  (s) => !['are', 'hektare'].includes(s.slug),
).flatMap((s) =>
  s.varian.map((v, i) => ({
    id: `${s.slug}-${i}`,
    label: `${s.nama} (${v.m2.toLocaleString('id-ID')} m², ${v.daerah})`,
    m2: v.m2,
  })),
);
const opsi = [...metrik, ...lokal];

const nilai = ref<number | null>(1);
const dari = ref(
  opsi.find(
    (o) => o.id === props.satuanAwal || o.id === `${props.satuanAwal}-0`,
  )?.id ?? 'm2',
);
const bentuk = ref<'persegi' | 'trapesium'>('persegi');
const panjang = ref<number | null>(null);
const lebar = ref<number | null>(null);
const sisiB = ref<number | null>(null);

const luasM2 = computed(() => {
  const unit = opsi.find((o) => o.id === dari.value);
  return unit && nilai.value !== null ? nilai.value * unit.m2 : null;
});
const hasil = computed(() =>
  luasM2.value === null
    ? []
    : opsi
        .filter((o) => o.id !== dari.value)
        .map((o) => ({ ...o, nilai: luasM2.value! / o.m2 })),
);
const dariUkuran = () => {
  const p = Number(panjang.value) || 0;
  const l = Number(lebar.value) || 0;
  nilai.value =
    bentuk.value === 'persegi'
      ? luasPersegiPanjang(p, l)
      : luasTrapesium(p, Number(sisiB.value) || 0, l);
  dari.value = 'm2';
  emit('hitung');
};
watch([nilai, dari], () => emit('hitung'));

const disalin = ref(false);
const salin = async () => {
  const unit = opsi.find((o) => o.id === dari.value)!;
  const text = [
    `${bulatkan(nilai.value ?? 0)} ${unit.label} =`,
    ...hasil.value.map((row) => `${bulatkan(row.nilai)} ${row.label}`),
  ].join('\n');
  await navigator.clipboard.writeText(text);
  disalin.value = true;
  setTimeout(() => (disalin.value = false), 2000);
};
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <section class="card space-y-3">
      <h2 class="font-semibold">Konversi luas</h2>
      <label for="luas-nilai" class="field-label">Luas</label>
      <input
        id="luas-nilai"
        v-model.number="nilai"
        type="number"
        min="0"
        step="any"
        inputmode="decimal"
        class="field-input"
      />
      <label for="luas-satuan" class="field-label">Satuan</label>
      <select id="luas-satuan" v-model="dari" class="field-input">
        <optgroup label="Satuan baku">
          <option v-for="o in metrik" :key="o.id" :value="o.id">
            {{ o.label }}
          </option>
        </optgroup>
        <optgroup label="Satuan lokal (per daerah)">
          <option v-for="o in lokal" :key="o.id" :value="o.id">
            {{ o.label }}
          </option>
        </optgroup>
      </select>
    </section>
    <section class="card space-y-3">
      <h2 class="font-semibold">Hitung dari ukuran tanah (meter)</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="bentuk === 'persegi'"
          @click="bentuk = 'persegi'"
        >
          Persegi panjang
        </button>
        <button
          type="button"
          class="btn-secondary"
          :aria-pressed="bentuk === 'trapesium'"
          @click="bentuk = 'trapesium'"
        >
          Trapesium
        </button>
      </div>
      <label for="ukuran-panjang" class="field-label">{{
        bentuk === 'persegi' ? 'Panjang (m)' : 'Sisi sejajar A (m)'
      }}</label>
      <input
        id="ukuran-panjang"
        v-model.number="panjang"
        type="number"
        min="0"
        step="any"
        class="field-input"
      />
      <template v-if="bentuk === 'trapesium'">
        <label for="ukuran-sisi-b" class="field-label"
          >Sisi sejajar B (m)</label
        >
        <input
          id="ukuran-sisi-b"
          v-model.number="sisiB"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </template>
      <label for="ukuran-lebar" class="field-label">{{
        bentuk === 'persegi' ? 'Lebar (m)' : 'Tinggi/jarak sisi sejajar (m)'
      }}</label>
      <input
        id="ukuran-lebar"
        v-model.number="lebar"
        type="number"
        min="0"
        step="any"
        class="field-input"
      />
      <button type="button" class="btn-primary" @click="dariUkuran">
        Hitung luas
      </button>
    </section>
  </div>
  <section v-if="hasil.length" class="card" aria-live="polite">
    <div class="flex items-center justify-between">
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ bulatkan(luasM2 ?? 0) }} m²
      </p>
      <button type="button" class="btn-secondary" @click="salin">
        {{ disalin ? 'Tersalin' : 'Salin hasil' }}
      </button>
    </div>
    <table class="tabular mt-3 w-full text-sm">
      <tbody>
        <tr
          v-for="row in hasil"
          :key="row.id"
          class="border-t border-slate-100"
        >
          <td class="py-2">{{ row.label }}</td>
          <td class="py-2 text-right font-semibold">
            {{ bulatkan(row.nilai) }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
