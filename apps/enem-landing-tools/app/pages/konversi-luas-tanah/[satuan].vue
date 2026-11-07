<script setup lang="ts">
import { SATUAN_LOKAL } from '~/data/satuan';

const SLUG = 'konversi-luas-tanah';
const route = useRoute();
const satuan = SATUAN_LOKAL.find((s) => s.slug === route.params['satuan']);
if (!satuan) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Satuan tidak dikenal',
    fatal: true,
  });
}
const nama = satuan.nama.toLowerCase();
const nilaiTeks = satuan.varian
  .map((v) => `${v.m2.toLocaleString('id-ID')} m² (${v.daerah})`)
  .join(' atau ');
const faqs = [
  { q: `1 ${nama} berapa meter persegi?`, a: `1 ${nama} = ${nilaiTeks}.` },
  {
    q: `${satuan.nama} dipakai di mana?`,
    a: satuan.varian.map((v) => v.daerah).join('; ') + '.',
  },
];
const kelipatan = [1, 2, 5, 10, 50, 100];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/konversi-luas-tanah/${satuan.slug}`"
    :og-key="SLUG"
    :parent="{ name: 'Konversi luas tanah', path: '/konversi-luas-tanah' }"
    :title="`1 ${satuan.nama} Berapa Meter Persegi?`"
    :seo-title="`1 ${satuan.nama} Berapa m²? Konversi ${satuan.nama} ke Meter Persegi`"
    :description="`1 ${nama} = ${nilaiTeks}. Tabel konversi dan kalkulator ${nama} ke m², are, dan hektare.`"
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :sources="satuan.varian.map((v) => v.sumber)"
    checked-at="2026-11-06"
    :caveats="[
      'Nilai satuan lokal bisa berbeda per desa. Pastikan luas m² tertulis di perjanjian jual beli.',
    ]"
  >
    <section class="card">
      <p class="text-lg">
        1 {{ nama }} = <strong>{{ nilaiTeks }}</strong>
      </p>
      <table class="tabular mt-3 w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-2 font-medium">{{ satuan.nama }}</th>
            <th
              v-for="v in satuan.varian"
              :key="v.m2"
              class="py-2 text-right font-medium"
            >
              m² ({{ v.daerah }})
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="n in kelipatan" :key="n" class="border-t border-slate-100">
            <td class="py-2">{{ n }}</td>
            <td
              v-for="v in satuan.varian"
              :key="v.m2"
              class="py-2 text-right font-semibold"
            >
              {{ (n * v.m2).toLocaleString('id-ID') }}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <LuasTanahCalculator
      :satuan-awal="satuan.slug === 'hektare' ? 'ha' : satuan.slug"
    />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
