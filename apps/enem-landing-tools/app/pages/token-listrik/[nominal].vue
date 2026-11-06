<script setup lang="ts">
import { NOMINAL_TOKEN, TARIF_LISTRIK } from '~/data/listrik/tarif';
import { formatRupiah } from '~/utils/format';
import { kwhDariNominal } from '~/utils/listrik';

const SLUG = 'kalkulator-token-listrik';
const route = useRoute();
const nominal = Number(route.params['nominal']);
if (!(NOMINAL_TOKEN as readonly number[]).includes(nominal)) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Nominal tidak tersedia',
    fatal: true,
  });
}
const label = formatRupiah(nominal);
const rows = TARIF_LISTRIK.golongan.map((golongan) => ({
  golongan,
  hasil: kwhDariNominal({
    golongan,
    nominal,
    admin: 0,
    pajakDaerahPersen: TARIF_LISTRIK.pajakDaerahBawaanPersen,
  }),
}));
const ribu =
  nominal >= 1_000_000
    ? `${nominal / 1_000_000} juta`
    : `${nominal / 1000} ribu`;
const faqs = [
  {
    q: `Token ${ribu} dapat berapa kWh?`,
    a: `Dengan pajak daerah ${TARIF_LISTRIK.pajakDaerahBawaanPersen}% dan tanpa biaya admin, token ${label} untuk 1.300 VA mendapat sekitar ${rows.find((row) => row.golongan.id === 'r1-1300')!.hasil.kwh.toLocaleString('id-ID')} kWh. Angka pastinya tergantung golongan, pajak daerah, dan biaya admin.`,
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/token-listrik/${nominal}`"
    :parent="{
      name: 'Kalkulator token listrik',
      path: '/kalkulator-token-listrik',
    }"
    :title="`Token Listrik ${ribu} Dapat Berapa kWh?`"
    :seo-title="`Token Listrik ${ribu} Dapat Berapa kWh (${TARIF_LISTRIK.periode})`"
    :description="`Berapa kWh dari token listrik PLN ${label} untuk setiap golongan (450 VA sampai 6.600 VA), tarif ${TARIF_LISTRIK.periode}.`"
    application-category="UtilitiesApplication"
    :faqs="faqs"
    :sources="TARIF_LISTRIK.sources"
    :checked-at="TARIF_LISTRIK.checkedAt"
    :caveats="[
      `Contoh memakai pajak daerah ${TARIF_LISTRIK.pajakDaerahBawaanPersen}% tanpa biaya admin.`,
      ...TARIF_LISTRIK.caveats,
    ]"
  >
    <section class="card">
      <table class="tabular w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-2 font-medium">Golongan</th>
            <th class="py-2 text-right font-medium">Tarif/kWh</th>
            <th class="py-2 text-right font-medium">kWh didapat</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.golongan.id"
            class="border-t border-slate-100"
          >
            <td class="py-2">{{ row.golongan.label }}</td>
            <td class="py-2 text-right">
              Rp{{ row.golongan.rupiahPerKwh.toLocaleString('id-ID') }}
            </td>
            <td class="py-2 text-right font-semibold">
              {{ row.hasil.kwh.toLocaleString('id-ID') }} kWh
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <TokenListrikCalculator :nominal-awal="nominal" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
