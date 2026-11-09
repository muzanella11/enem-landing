<script setup lang="ts">
import { NOMINAL_GAJI, labelJuta } from '~/data/distribusi';
import { PAYROLL_RULES_2026 } from '~/data/tax/2026';
import { formatRupiah } from '~/utils/format';
import { gajiLink } from '~/utils/gaji-link';
import { gajiBersihPerStatus } from '~/utils/halaman-jawaban';

const SLUG = 'kalkulator-gaji-bersih';
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
const rows = gajiBersihPerStatus(nominal);
const tk0 = rows[0]!;
const faqs = [
  {
    q: `Gaji ${juta} bersihnya berapa?`,
    a: `Untuk karyawan lajang (TK/0) yang ikut BPJS Kesehatan dan Ketenagakerjaan, gaji pokok ${formatRupiah(nominal)} tanpa tunjangan menjadi sekitar ${formatRupiah(tk0.januari)} per bulan di Januari sampai November (PPh 21 ${formatRupiah(tk0.pph21Januari)}, iuran BPJS ${formatRupiah(tk0.bpjs)}). Desember bisa berbeda karena perhitungan ulang PPh 21 setahun.`,
  },
  {
    q: 'Kenapa gaji Desember berbeda?',
    a: 'Sejak 2024 PPh 21 Januari sampai November memakai tarif efektif (TER), lalu di Desember dihitung ulang dengan tarif setahun (PMK 168/2023). Selisihnya membuat potongan Desember bisa lebih besar atau lebih kecil.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/gaji-bersih/${nominal}`"
    :og-key="SLUG"
    :parent="{
      name: 'Kalkulator gaji bersih',
      path: '/kalkulator-gaji-bersih',
    }"
    :title="`Gaji ${juta} Bersihnya Berapa?`"
    :seo-title="`Gaji ${juta} Bersih Berapa? Potongan PPh 21 dan BPJS 2026`"
    :description="`Gaji pokok ${formatRupiah(nominal)} bersihnya sekitar ${formatRupiah(tk0.januari)} per bulan (TK/0). Rincian PPh 21 TER, BPJS, dan perbandingan status PTKP.`"
    :faqs="faqs"
    :sources="PAYROLL_RULES_2026.sources"
    :checked-at="PAYROLL_RULES_2026.checkedAt"
    :caveats="[
      'Contoh tanpa tunjangan dan THR, risiko JKK terendah. Isi data sebenarnya di kalkulator untuk hasil yang pas.',
    ]"
  >
    <section class="card" aria-live="polite">
      <p class="text-sm text-slate-600">
        Gaji bersih per bulan (TK/0, Januari-November)
      </p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(tk0.januari) }}
      </p>
      <table class="tabular mt-4 w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-2 font-medium">Status</th>
            <th class="py-2 text-right font-medium">PPh 21/bulan</th>
            <th class="py-2 text-right font-medium">Bersih Jan-Nov</th>
            <th class="py-2 text-right font-medium">Bersih Desember</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.ptkp" class="border-t border-slate-100">
            <td class="py-2">{{ r.ptkp }}</td>
            <td class="py-2 text-right">{{ formatRupiah(r.pph21Januari) }}</td>
            <td class="py-2 text-right font-semibold">
              {{ formatRupiah(r.januari) }}
            </td>
            <td class="py-2 text-right">{{ formatRupiah(r.desember) }}</td>
          </tr>
        </tbody>
      </table>
      <NuxtLink
        :to="gajiLink({ gajiPokok: nominal })"
        class="btn-primary mt-4 inline-block"
        >Hitung dengan tunjangan dan status saya</NuxtLink
      >
    </section>
    <nav class="flex flex-wrap gap-3 text-sm">
      <NuxtLink
        v-for="n in NOMINAL_GAJI.filter((x) => x !== nominal)"
        :key="n"
        :to="`/gaji-bersih/${n}`"
        class="btn-link"
        >Gaji {{ labelJuta(n) }}</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
