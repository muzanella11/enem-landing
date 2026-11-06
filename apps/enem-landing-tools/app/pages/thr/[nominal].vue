<script setup lang="ts">
import { NOMINAL_GAJI, labelJuta } from '~/data/distribusi';
import { formatRupiah } from '~/utils/format';
import { pajakThrPenuh, thrPerMasaKerja } from '~/utils/halaman-jawaban';

const SLUG = 'kalkulator-thr';
const route = useRoute();
const nominal = Number(route.params['nominal']);
if (!(NOMINAL_GAJI as readonly number[]).includes(nominal)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Nominal tidak tersedia',
    fatal: true,
  });
}
const juta = labelJuta(nominal);
const rows = thrPerMasaKerja(nominal);
const pajak = pajakThrPenuh(nominal);
const faqs = [
  {
    q: `THR gaji ${juta} dapat berapa?`,
    a: `Karyawan dengan masa kerja 12 bulan atau lebih mendapat THR 1 bulan upah, yaitu ${formatRupiah(nominal)}. Di bawah 12 bulan dihitung proporsional: masa kerja / 12 x upah (Permenaker 6/2016).`,
  },
  {
    q: 'Apakah THR kena pajak?',
    a: `Ya. THR ditambahkan ke penghasilan bulan pembayarannya sehingga PPh 21 bulan itu naik. Untuk status TK/0 tanpa tunjangan, tambahan PPh 21-nya sekitar ${formatRupiah(pajak.tambahanPph21)}, sehingga THR bersih sekitar ${formatRupiah(pajak.thrBersih)}.`,
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/thr/${nominal}`"
    :og-key="SLUG"
    :parent="{ name: 'Kalkulator THR', path: '/kalkulator-thr' }"
    :title="`THR Gaji ${juta} Dapat Berapa?`"
    :seo-title="`THR Gaji ${juta}: Penuh, Proporsional, dan Pajaknya`"
    :description="`THR untuk gaji ${formatRupiah(nominal)}: penuh ${formatRupiah(nominal)} untuk masa kerja 12 bulan, proporsional di bawahnya, beserta potongan PPh 21-nya.`"
    :faqs="faqs"
    :sources="[
      {
        label: 'Permenaker 6/2016 tentang THR keagamaan',
        url: 'https://jdih.kemnaker.go.id/',
      },
    ]"
    checked-at="2026-11-06"
    :caveats="[
      'Pajak dihitung untuk status TK/0, THR dibayar di bulan Maret, tanpa tunjangan lain.',
    ]"
  >
    <section class="card" aria-live="polite">
      <p class="text-sm text-slate-600">
        THR penuh (masa kerja 12 bulan atau lebih)
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(nominal) }}
      </p>
      <p class="tabular text-sm">
        Setelah PPh 21 (TK/0): sekitar {{ formatRupiah(pajak.thrBersih) }}
      </p>
      <table class="tabular mt-4 w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-2 font-medium">Masa kerja</th>
            <th class="py-2 text-right font-medium">THR</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in rows"
            :key="r.bulan"
            class="border-t border-slate-100"
          >
            <td class="py-2">
              {{ r.bulan }} bulan{{ r.bulan === 12 ? ' atau lebih' : '' }}
            </td>
            <td class="py-2 text-right font-semibold">
              {{ formatRupiah(r.thr) }}
            </td>
          </tr>
        </tbody>
      </table>
      <NuxtLink to="/kalkulator-thr" class="btn-primary mt-4 inline-block"
        >Hitung THR saya</NuxtLink
      >
    </section>
    <nav class="flex flex-wrap gap-3 text-sm">
      <NuxtLink
        v-for="n in NOMINAL_GAJI.filter((x) => x !== nominal)"
        :key="n"
        :to="`/thr/${n}`"
        class="btn-link"
        >THR {{ labelJuta(n) }}</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
