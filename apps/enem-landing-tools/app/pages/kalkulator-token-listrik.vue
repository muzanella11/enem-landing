<script setup lang="ts">
import { NOMINAL_TOKEN, TARIF_LISTRIK } from '~/data/listrik/tarif';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-token-listrik';
const faqs = [
  {
    q: 'Kenapa kWh yang didapat lebih kecil dari perkiraan?',
    a: 'Sebagian nominal token dipotong biaya admin dan pajak daerah atas listrik (PBJT/PPJ), dan untuk 6.600 VA ke atas juga PPN. Sisanya baru dibagi tarif per kWh golonganmu.',
  },
  {
    q: 'Berapa tarif listrik per kWh sekarang?',
    a: `Untuk ${TARIF_LISTRIK.periode}: 450 VA subsidi Rp415, 900 VA subsidi Rp605, 900 VA RTM Rp1.352, 1.300 dan 2.200 VA Rp1.444,70, serta 3.500 VA ke atas Rp1.699,53 per kWh.`,
  },
  {
    q: 'Beda subsidi dan nonsubsidi?',
    a: 'Pelanggan 450 VA dan 900 VA yang terdaftar sebagai penerima subsidi membayar tarif lebih rendah. 900 VA rumah tangga mampu (RTM) membayar tarif nonsubsidi.',
  },
];
const howTo = [
  'Pilih golongan atau daya listrik rumahmu.',
  'Isi nominal token, biaya admin, dan persentase pajak daerah dari struk.',
  'Lihat kWh yang didapat, atau isi kebutuhan kWh untuk tahu nominal yang perlu dibeli.',
  'Isi daftar alat listrik untuk memperkirakan berapa lama token bertahan.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Token Listrik PLN"
    seo-title="Kalkulator Token Listrik: Token 100 Ribu Dapat Berapa kWh"
    description="Hitung berapa kWh yang didapat dari token listrik PLN per golongan, termasuk biaya admin dan pajak daerah, plus perkiraan pemakaian alat listrik sebulan."
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="TARIF_LISTRIK.sources"
    :checked-at="TARIF_LISTRIK.checkedAt"
    :caveats="[`Tarif ${TARIF_LISTRIK.periode}.`, ...TARIF_LISTRIK.caveats]"
  >
    <TokenListrikCalculator />
    <section class="card text-sm">
      <h2 class="font-semibold">Token per nominal</h2>
      <ul class="mt-2 flex flex-wrap gap-2">
        <li v-for="nominal in NOMINAL_TOKEN" :key="nominal">
          <NuxtLink :to="`/token-listrik/${nominal}`" class="btn-secondary"
            >Token {{ formatRupiah(nominal) }}</NuxtLink
          >
        </li>
      </ul>
    </section>
    <DonationCta placement="after-result" :slug="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
