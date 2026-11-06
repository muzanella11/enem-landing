<script setup lang="ts">
import { CHECKED_AT, SUMBER_ASURANSI } from '~/data/asuransi/tarif-ojk';

const SLUG = 'simulasi-asuransi-motor';
const faqs = [
  {
    q: 'Apa beda asuransi all risk dan TLO?',
    a: 'Comprehensive (all risk) menjamin kerusakan sebagian maupun total. Total Loss Only (TLO) hanya menjamin kerugian total, yaitu kendaraan hilang dicuri atau rusak dengan biaya perbaikan sekitar 75% atau lebih dari nilainya. Premi TLO jauh lebih murah.',
  },
  {
    q: 'Dari mana tarif premi ini?',
    a: 'OJK menetapkan batas bawah dan batas atas tarif premi per jenis kendaraan, nilai pertanggungan, dan wilayah plat nomor (SEOJK 6/SEOJK.05/2017). Perusahaan asuransi memilih tarif di dalam rentang itu sesuai profil risiko.',
  },
  {
    q: 'Kenapa kendaraan tua lebih mahal?',
    a: 'Untuk jaminan comprehensive pada kendaraan berusia di atas 5 tahun, OJK mewajibkan tambahan premi paling sedikit 5% dari tarif per tahun, atau risiko sendiri paling sedikit Rp500.000. Kalkulator ini memakai tambahan 5% per tahun kelebihan usia.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi Asuransi Motor"
    seo-title="Simulasi Asuransi Motor All Risk dan TLO Sesuai Tarif OJK"
    description="Hitung perkiraan premi asuransi sepeda motor comprehensive dan TLO sesuai batas tarif OJK per wilayah, termasuk perluasan jaminan dan simulasi sepanjang tenor kredit."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_ASURANSI"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Hasil berupa rentang batas bawah sampai batas atas tarif OJK. Premi di polis bisa berbeda karena perusahaan memilih tarif di dalam rentang, menambah fitur layanan, atau memberi potongan untuk armada besar.',
      'Tarif perluasan jaminan dikutip dari ringkasan produk perusahaan asuransi yang merujuk SEOJK 6/2017.',
    ]"
  >
    <AsuransiKendaraanCalculator :slug="SLUG" motor />
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/simulasi-kredit-kendaraan" class="btn-link"
        >Simulasi kredit kendaraan</NuxtLink
      >
      <NuxtLink to="/kalkulator-pajak-kendaraan" class="btn-link"
        >Pajak kendaraan</NuxtLink
      >
      <NuxtLink to="/simulasi-asuransi-mobil" class="btn-link"
        >Simulasi asuransi mobil</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
