<script setup lang="ts">
import {
  CHECKED_AT,
  LABEL_RODA,
  SUMBER_PNBP,
  TARIF_DOKUMEN,
  type JenisRoda,
} from '~/data/kendaraan';
import { formatRupiah } from '~/utils/format';

const SLUG = 'biaya-stnk-bpkb';
const events = useToolEvents(SLUG);
const roda = ref<JenisRoda>('r2');
const SKENARIO = [
  {
    id: 'ganti-plat',
    label: 'Perpanjang STNK 5 tahunan (ganti plat)',
    item: ['stnk', 'tnkb'],
  },
  {
    id: 'balik-nama',
    label: 'Balik nama (ganti pemilik)',
    item: ['stnk', 'tnkb', 'bpkb'],
  },
  {
    id: 'kendaraan-baru',
    label: 'Kendaraan baru',
    item: ['stnk', 'tnkb', 'bpkb'],
  },
] as const;
const LABEL = {
  stnk: 'STNK',
  tnkb: 'Plat nomor (TNKB) per pasang',
  bpkb: 'BPKB',
} as const;
const skenario = ref<(typeof SKENARIO)[number]['id']>('ganti-plat');
const terpilih = computed(() => SKENARIO.find((s) => s.id === skenario.value)!);
const total = computed(() =>
  terpilih.value.item.reduce(
    (sum, key) => sum + TARIF_DOKUMEN[roda.value][key],
    0,
  ),
);
watch([roda, skenario], () =>
  events.calculate(`${skenario.value}-${roda.value}`),
);
const faqs = [
  {
    q: 'Berapa biaya ganti plat motor 5 tahunan?',
    a: 'PNBP STNK Rp100.000 dan TNKB Rp60.000 (PP 76/2020), ditambah PKB tahunan, opsen, dan SWDKLLJ yang dibayar di Samsat. Hitung pajaknya di Kalkulator Pajak Kendaraan.',
  },
  {
    q: 'Apakah biaya balik nama sudah termasuk BBNKB?',
    a: 'Belum. Bea Balik Nama Kendaraan Bermotor (BBNKB) adalah pajak daerah dan ditetapkan per provinsi. Beberapa provinsi sudah membebaskan BBNKB untuk kendaraan bekas.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Biaya STNK, Plat Nomor, dan BPKB"
    seo-title="Biaya Ganti Plat, Perpanjang STNK, dan BPKB (Tarif PP 76/2020)"
    description="Tarif resmi PNBP STNK, TNKB (plat nomor), dan BPKB untuk motor dan mobil menurut PP 76/2020, dengan total per keperluan seperti ganti plat dan balik nama."
    :faqs="faqs"
    :sources="SUMBER_PNBP"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Belum termasuk pajak kendaraan (PKB, opsen), SWDKLLJ, dan BBNKB yang ditetapkan per provinsi.',
    ]"
  >
    <section class="card grid gap-3 sm:grid-cols-2">
      <div>
        <label for="stnk-roda" class="field-label">Kendaraan</label>
        <select id="stnk-roda" v-model="roda" class="field-input">
          <option v-for="(label, key) in LABEL_RODA" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>
      <div>
        <label for="stnk-skenario" class="field-label">Keperluan</label>
        <select id="stnk-skenario" v-model="skenario" class="field-input">
          <option v-for="s in SKENARIO" :key="s.id" :value="s.id">
            {{ s.label }}
          </option>
        </select>
      </div>
    </section>
    <section class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Total PNBP</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(total) }}
      </p>
      <ul class="tabular text-sm">
        <li v-for="key in terpilih.item" :key="key">
          {{ LABEL[key] }}: {{ formatRupiah(TARIF_DOKUMEN[roda][key]) }}
        </li>
      </ul>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-pajak-kendaraan" class="btn-link"
        >Hitung pajak kendaraan</NuxtLink
      >
      <NuxtLink to="/biaya-sim" class="btn-link">Biaya SIM</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
