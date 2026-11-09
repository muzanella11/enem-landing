<script setup lang="ts">
import {
  CHECKED_AT,
  LABEL_RODA,
  PKB,
  SUMBER_PAJAK,
  SUMBER_PNBP,
  type JenisRoda,
} from '~/data/kendaraan';
import { formatRupiah } from '~/utils/format';
import { bulanTerlambat, hitungPkb } from '~/utils/kendaraan';

const SLUG = 'kalkulator-pajak-kendaraan';
const events = useToolEvents(SLUG);
const form = reactive({
  roda: 'r2' as JenisRoda,
  wilayah: 'umum' as 'umum' | 'dki',
  njkb: 0,
  bobot: 1,
  tarif: PKB.tarifMaksPertama,
  jatuhTempo: '',
  tanggalBayar: '',
  gantiPlat: false,
});
const hasil = ref<ReturnType<typeof hitungPkb> | null>(null);
const telat = ref(0);
onMounted(() => {
  form.tanggalBayar = new Date().toLocaleDateString('sv-SE');
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
watch(
  () => form.wilayah,
  (wilayah) =>
    (form.tarif =
      wilayah === 'dki' ? PKB.dkiMaksPertama : PKB.tarifMaksPertama),
);
const hitung = () => {
  if (!(form.njkb > 0)) return;
  telat.value = bulanTerlambat(form.jatuhTempo, form.tanggalBayar);
  hasil.value = hitungPkb({
    roda: form.roda,
    njkb: form.njkb,
    bobot: Number(form.bobot) || 1,
    tarifPersen: Number(form.tarif),
    denganOpsen: form.wilayah === 'umum',
    bulanTerlambat: telat.value,
    gantiPlat: form.gantiPlat,
  });
  events.calculate(form.gantiPlat ? 'ganti-plat' : 'tahunan');
};
const rincian = computed(() =>
  hasil.value
    ? (
        [
          ['PKB', hasil.value.pkb],
          ['Opsen PKB (66%)', hasil.value.opsen],
          ['SWDKLLJ (Jasa Raharja)', hasil.value.swdkllj],
          ['Denda PKB', hasil.value.dendaPkb],
          ['Denda opsen', hasil.value.dendaOpsen],
          ['Denda SWDKLLJ', hasil.value.dendaSwdkllj],
          ['STNK (5 tahunan)', hasil.value.stnk],
          ['Plat nomor/TNKB (5 tahunan)', hasil.value.tnkb],
        ] as const
      ).filter(([, value]) => value > 0)
    : [],
);
const faqs = [
  {
    q: 'Bagaimana cara menghitung pajak kendaraan?',
    a: 'PKB = NJKB x bobot x tarif provinsi. Sejak 2025 (UU 1/2022) ada opsen PKB untuk kabupaten/kota sebesar 66% dari PKB, kecuali di DKI Jakarta. Ditambah SWDKLLJ Jasa Raharja.',
  },
  {
    q: 'Di mana melihat NJKB dan tarif?',
    a: 'NJKB tercantum di Peraturan Gubernur tiap tahun dan biasanya bisa dicek lewat aplikasi atau situs Samsat/Bapenda provinsi. Tarif PKB ada di Perda pajak daerah provinsi Anda.',
  },
  {
    q: 'Berapa denda telat bayar pajak kendaraan?',
    a: 'Menurut UU 1/2022, sanksi bunga 1% per bulan dari pokok pajak, paling lama 24 bulan, ditambah denda SWDKLLJ. Banyak provinsi kadang memberi program pemutihan denda.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Pajak Kendaraan"
    seo-title="Kalkulator Pajak Motor dan Mobil: PKB, Opsen, Denda, Ganti Plat"
    description="Estimasi pajak kendaraan tahunan dan 5 tahunan (ganti plat): PKB, opsen PKB 66% (UU 1/2022), SWDKLLJ, dan denda keterlambatan."
    :faqs="faqs"
    :how-to="[
      'Pilih jenis kendaraan dan wilayah.',
      'Isi NJKB dan tarif PKB provinsi Anda.',
      'Isi jatuh tempo bila terlambat, centang ganti plat bila 5 tahunan, lalu Hitung.',
    ]"
    :sources="[...SUMBER_PAJAK, ...SUMBER_PNBP]"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Tarif PKB tiap provinsi diatur Perda masing-masing; nilai bawaan adalah batas maksimum UU 1/2022 untuk kendaraan pertama. Ganti dengan tarif provinsi Anda.',
      'Untuk tagihan pasti berdasarkan plat nomor, cek di aplikasi atau situs Samsat/Bapenda resmi provinsi Anda.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="pkb-roda" class="field-label">Kendaraan</label>
        <select id="pkb-roda" v-model="form.roda" class="field-input">
          <option v-for="(label, key) in LABEL_RODA" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>
      <div>
        <label for="pkb-wilayah" class="field-label">Wilayah</label>
        <select id="pkb-wilayah" v-model="form.wilayah" class="field-input">
          <option value="umum">Provinsi selain DKI Jakarta (ada opsen)</option>
          <option value="dki">DKI Jakarta (tanpa opsen)</option>
        </select>
      </div>
      <RupiahInput
        id="pkb-njkb"
        v-model="form.njkb"
        label="NJKB (nilai jual kendaraan)"
      />
      <div>
        <label for="pkb-tarif" class="field-label"
          >Tarif PKB provinsi (%)</label
        >
        <input
          id="pkb-tarif"
          v-model.number="form.tarif"
          type="number"
          min="0"
          max="10"
          step="0.01"
          class="field-input"
        />
      </div>
      <div>
        <label for="pkb-bobot" class="field-label">Bobot</label>
        <input
          id="pkb-bobot"
          v-model.number="form.bobot"
          type="number"
          min="1"
          max="1.3"
          step="0.025"
          class="field-input"
        />
      </div>
      <div>
        <label for="pkb-jatuh-tempo" class="field-label"
          >Jatuh tempo (bila terlambat)</label
        >
        <input
          id="pkb-jatuh-tempo"
          v-model="form.jatuhTempo"
          type="date"
          class="field-input"
        />
      </div>
      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input v-model="form.gantiPlat" type="checkbox" /> Sekalian ganti plat 5
        tahunan (STNK + TNKB)
      </label>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung pajak
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        Perkiraan total bayar<template v-if="telat">
          (terlambat {{ telat }} bulan)</template
        >
      </p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.total) }}
      </p>
      <table class="tabular w-full text-sm">
        <tbody>
          <tr
            v-for="[label, value] in rincian"
            :key="label"
            class="border-t border-slate-100"
          >
            <td class="py-1">{{ label }}</td>
            <td class="py-1 text-right">{{ formatRupiah(value) }}</td>
          </tr>
        </tbody>
      </table>
      <ShareButton
        :tool-id="SLUG"
        :state="form"
        title="Estimasi pajak kendaraan"
      />
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/simulasi-kredit-kendaraan" class="btn-link"
        >Simulasi kredit kendaraan</NuxtLink
      >
      <NuxtLink to="/biaya-stnk-bpkb" class="btn-link"
        >Biaya STNK dan BPKB</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
