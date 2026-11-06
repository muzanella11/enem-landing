<script setup lang="ts">
import {
  PERLUASAN,
  type JenisJaminan,
  type JenisKendaraan,
  type JenisPerluasan,
} from '~/data/asuransi/tarif-ojk';
import { UMP_PROVINSI } from '~/data/upah-minimum';
import {
  hitungPremi,
  premiDariTarif,
  simulasiTahunan,
  wilayahProvinsi,
  type Rentang,
} from '~/utils/asuransi';
import { formatRupiah } from '~/utils/format';

/** Premium simulator shared by the car and motorcycle pages (Story 51). */
const props = defineProps<{ slug: string; motor?: boolean }>();
const events = useToolEvents(props.slug);
const provinsi = [...UMP_PROVINSI.map((p) => p.nama)].sort();
const form = reactive({
  jenis: (props.motor ? 'motor' : 'penumpang') as JenisKendaraan,
  provinsi: 'DKI Jakarta',
  nilai: 0,
  tahunPembuatan: new Date().getFullYear(),
  jaminan: 'comprehensive' as JenisJaminan,
  perluasan: [] as JenisPerluasan[],
  tjhLimit: 0,
  tahun: 1,
  penyusutan: 10,
  tarifPenawaran: 0,
});
onMounted(() => {
  const shared = useSharedState<typeof form>(props.slug);
  if (shared) Object.assign(form, shared);
});
const wilayah = computed(() => wilayahProvinsi(form.provinsi));
const usia = computed(() =>
  Math.max(0, new Date().getFullYear() - form.tahunPembuatan),
);
const input = computed(() => ({
  jenis: form.jenis,
  wilayah: wilayah.value,
  nilai: form.nilai,
  jaminan: form.jaminan,
  usia: usia.value,
  perluasan: form.perluasan,
  tjhLimit: form.tjhLimit || undefined,
}));
const hasil = computed(() =>
  form.nilai > 0 ? hitungPremi(input.value) : null,
);
const multi = computed(() =>
  form.nilai > 0 && form.tahun > 1
    ? simulasiTahunan(input.value, form.tahun, form.penyusutan)
    : [],
);
const rentang = (r: Rentang) =>
  Math.round(r[0]) === Math.round(r[1])
    ? formatRupiah(r[0])
    : `${formatRupiah(r[0])} - ${formatRupiah(r[1])}`;
const persen = (r: Rentang) =>
  r[0] === r[1]
    ? `${r[0].toLocaleString('id-ID')}%`
    : `${r[0].toLocaleString('id-ID', { maximumFractionDigits: 3 })}% - ${r[1].toLocaleString('id-ID', { maximumFractionDigits: 3 })}%`;
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(`${form.jenis}-${form.jaminan}`);
  }
});
</script>

<template>
  <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
    <div v-if="!motor">
      <label for="as-jenis" class="field-label">Jenis kendaraan</label>
      <select id="as-jenis" v-model="form.jenis" class="field-input">
        <option value="penumpang">Mobil penumpang (bukan bus/truk)</option>
        <option value="truk">Truk dan pickup</option>
        <option value="bus">Bus</option>
      </select>
    </div>
    <div>
      <label for="as-provinsi" class="field-label">Provinsi plat nomor</label>
      <select id="as-provinsi" v-model="form.provinsi" class="field-input">
        <option v-for="p in provinsi" :key="p" :value="p">{{ p }}</option>
      </select>
      <p class="text-xs text-slate-500">
        Wilayah {{ wilayah }} (tarif mengikuti tempat kendaraan terdaftar)
      </p>
    </div>
    <RupiahInput
      id="as-nilai"
      v-model="form.nilai"
      :label="
        motor
          ? 'Harga motor (nilai pertanggungan)'
          : 'Harga mobil (nilai pertanggungan)'
      "
    />
    <div>
      <label for="as-tahun-buat" class="field-label">Tahun pembuatan</label>
      <input
        id="as-tahun-buat"
        v-model.number="form.tahunPembuatan"
        type="number"
        min="1980"
        :max="new Date().getFullYear() + 1"
        class="field-input"
      />
    </div>
    <fieldset class="sm:col-span-2">
      <legend class="field-label">Jenis jaminan</legend>
      <label class="mr-4 text-sm"
        ><input v-model="form.jaminan" type="radio" value="comprehensive" />
        Comprehensive (all risk)</label
      >
      <label class="text-sm"
        ><input v-model="form.jaminan" type="radio" value="tlo" /> Total Loss
        Only (TLO)</label
      >
    </fieldset>
    <fieldset class="sm:col-span-2">
      <legend class="field-label">Perluasan jaminan</legend>
      <label
        v-for="(p, key) in PERLUASAN"
        :key="key"
        class="mr-4 inline-flex items-center gap-1 text-sm"
        ><input v-model="form.perluasan" type="checkbox" :value="key" />
        {{ p.label }}</label
      >
    </fieldset>
    <RupiahInput
      v-if="!motor"
      id="as-tjh"
      v-model="form.tjhLimit"
      label="Limit tanggung jawab pihak ketiga (opsional)"
      hint="Tarif bertingkat sampai Rp100 juta."
    />
    <div>
      <label for="as-lama" class="field-label"
        >Lama simulasi (tahun, mis. tenor kredit)</label
      >
      <input
        id="as-lama"
        v-model.number="form.tahun"
        type="number"
        min="1"
        max="10"
        class="field-input"
      />
    </div>
    <div v-if="form.tahun > 1">
      <label for="as-susut" class="field-label"
        >Penyusutan nilai per tahun (%)</label
      >
      <input
        id="as-susut"
        v-model.number="form.penyusutan"
        type="number"
        min="0"
        max="50"
        class="field-input"
      />
      <p class="text-xs text-slate-500">
        Asumsi Anda, bukan angka baku; cek nilai pertanggungan di polis tiap
        tahun.
      </p>
    </div>
    <div>
      <label for="as-tarif" class="field-label"
        >Tarif dari penawaran asuransi (%, opsional)</label
      >
      <input
        id="as-tarif"
        v-model.number="form.tarifPenawaran"
        type="number"
        min="0"
        max="10"
        step="0.01"
        class="field-input"
      />
    </div>
  </form>
  <section v-if="hasil" class="card space-y-3" aria-live="polite">
    <p class="text-sm text-slate-600">
      Premi tahun pertama (kategori {{ hasil.kategori.kategori }}, wilayah
      {{ wilayah }})
    </p>
    <p class="tabular text-3xl font-bold text-teal-800">
      {{ rentang(hasil.total) }}
    </p>
    <p v-if="form.tarifPenawaran > 0" class="tabular text-sm">
      Dengan tarif penawaran {{ form.tarifPenawaran.toLocaleString('id-ID') }}%:
      {{ formatRupiah(premiDariTarif(form.nilai, form.tarifPenawaran)) }} (belum
      termasuk perluasan).
    </p>
    <table class="tabular w-full text-sm">
      <tbody>
        <tr
          v-for="r in hasil.rincian"
          :key="r.label"
          class="border-t border-slate-100"
        >
          <td class="py-1">
            {{ r.label
            }}<span v-if="r.tarif" class="text-slate-500">
              ({{ persen(r.tarif) }})</span
            >
          </td>
          <td class="py-1 text-right">{{ rentang(r.premi) }}</td>
        </tr>
      </tbody>
    </table>
    <template v-if="multi.length">
      <p class="font-medium">Premi per tahun selama {{ form.tahun }} tahun</p>
      <table class="tabular w-full text-sm">
        <tbody>
          <tr
            v-for="row in multi"
            :key="row.tahunKe"
            class="border-t border-slate-100"
          >
            <td class="py-1">
              Tahun {{ row.tahunKe }} (nilai {{ formatRupiah(row.nilai) }})
            </td>
            <td class="py-1 text-right">{{ rentang(row.total) }}</td>
          </tr>
          <tr class="border-t border-slate-300 font-semibold">
            <td class="py-1">Total</td>
            <td class="py-1 text-right">
              {{
                rentang([
                  multi.reduce((s, r) => s + r.total[0], 0),
                  multi.reduce((s, r) => s + r.total[1], 0),
                ])
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </template>
    <p class="text-xs text-slate-500">
      Belum termasuk biaya polis dan meterai. Tiap perusahaan asuransi
      menetapkan tarif di dalam rentang OJK.
    </p>
    <ShareButton
      :tool-id="slug"
      :state="form"
      title="Simulasi premi asuransi"
    />
  </section>
</template>
