<script setup lang="ts">
import { CHECKED_AT, SUMBER_PAJAK_USAHA } from '~/data/tax/usaha';
import { formatRupiah } from '~/utils/format';
import { hitungPpn } from '~/utils/pajak-usaha';

const SLUG = 'kalkulator-ppn';
const events = useToolEvents(SLUG);
const form = reactive({ harga: 0, sudahTermasuk: false, mewah: false });
const hasil = computed(() => (form.harga > 0 ? hitungPpn(form) : null));
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(form.mewah ? 'mewah' : 'umum');
  }
});
const faqs = [
  {
    q: 'PPN sekarang 11% atau 12%?',
    a: 'Tarifnya 12%. Untuk barang dan jasa yang bukan barang mewah, PPN dihitung dari DPP nilai lain 11/12 harga jual (PMK 131/2024), sehingga jumlahnya sama dengan 11% dari harga. Barang mewah kena 12% penuh.',
  },
  {
    q: 'Bagaimana menghitung harga sebelum PPN?',
    a: 'Untuk barang nonmewah: harga sebelum PPN = harga termasuk PPN / 1,11. Untuk barang mewah: dibagi 1,12.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator PPN"
    seo-title="Kalkulator PPN 12% (DPP 11/12): Harga Sebelum dan Sesudah PPN"
    description="Hitung PPN 12% dengan DPP nilai lain 11/12 untuk barang/jasa nonmewah atau 12% penuh untuk barang mewah, dari harga sebelum PPN maupun harga yang sudah termasuk PPN."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_PAJAK_USAHA.slice(0, 2)"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Bukan konsultasi pajak. Beberapa penyerahan memakai DPP nilai lain atau besaran tertentu yang berbeda (PMK 11/2025).',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput id="ppn-harga" v-model="form.harga" label="Harga" />
      <fieldset>
        <legend class="field-label">Harga tersebut</legend>
        <label class="mr-4 text-sm"
          ><input v-model="form.sudahTermasuk" type="radio" :value="false" />
          Belum termasuk PPN</label
        >
        <label class="text-sm"
          ><input v-model="form.sudahTermasuk" type="radio" :value="true" />
          Sudah termasuk PPN</label
        >
      </fieldset>
      <label class="flex items-center gap-2 text-sm"
        ><input v-model="form.mewah" type="checkbox" /> Barang mewah (kena
        PPnBM)</label
      >
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        PPN (tarif efektif {{ hasil.tarifEfektif.toLocaleString('id-ID') }}%)
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.ppn) }}
      </p>
      <p class="tabular text-sm">
        Harga sebelum PPN {{ formatRupiah(hasil.hargaJual) }} · DPP
        {{ formatRupiah(hasil.dpp) }} · total {{ formatRupiah(hasil.total) }}
      </p>
    </section>
    <PajakLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
