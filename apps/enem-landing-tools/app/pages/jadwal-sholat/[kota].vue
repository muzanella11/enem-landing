<script setup lang="ts">
import { KEMENAG_PARAMS } from '~/data/sholat/kemenag';
import { MONTH_NAMES } from '~/utils/format';
import {
  hariIniDiKota,
  jadwalBulanan,
  jadwalSholat,
  WAKTU,
  WAKTU_LABEL,
  zonaLabel,
} from '~/utils/sholat';
import { findKota } from '~/utils/sholat/kota';

const SLUG = 'jadwal-sholat';
const route = useRoute();
const kota = findKota(route.params['kota'] as string);
if (!kota)
  throw createError({
    statusCode: 404,
    statusMessage: 'Kota tidak ditemukan',
    fatal: true,
  });

const tanggal = ref(hariIniDiKota(kota.zona));
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  tanggal.value = hariIniDiKota(kota.zona);
  timer = setInterval(() => {
    now.value = Date.now();
    tanggal.value = hariIniDiKota(kota.zona);
  }, 30_000);
});
onBeforeUnmount(() => clearInterval(timer));

const hariIni = computed(() => jadwalSholat(kota, tanggal.value));
const [tahun, bulan] = tanggal.value.split('-').map(Number) as [number, number];
const bulanan = computed(() => jadwalBulanan(kota, tahun, bulan));
const zona = zonaLabel(kota.zona);

const SHOLAT_WAJIB = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const;
const berikutnya = computed(() => {
  for (const key of SHOLAT_WAJIB) {
    const instant = hariIni.value.instan[key];
    if (instant.getTime() > now.value)
      return {
        key,
        menit: Math.ceil((instant.getTime() - now.value) / 60_000),
      };
  }
  return null;
});
const cetak = () => window.print();
const formatSisa = (menit: number) =>
  menit >= 60
    ? `${Math.floor(menit / 60)} jam ${menit % 60} menit`
    : `${menit} menit`;
const tanggalPanjang = computed(() =>
  new Date(`${tanggal.value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
);

const faqs = [
  {
    q: `Jam berapa Maghrib di ${kota.nama} hari ini?`,
    a: `Maghrib di ${kota.nama} hari ini pukul ${jadwalSholat(kota, hariIniDiKota(kota.zona)).waktu.maghrib} ${zona}.`,
  },
  {
    q: 'Metode apa yang dipakai?',
    a: 'Kriteria Kemenag RI (Subuh 20 derajat, Isya 18 derajat, ihtiyat sekitar 2 menit), dengan koordinat dan ketinggian kota ini.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/jadwal-sholat/${kota!.slug}`"
    og-key="jadwal-sholat"
    :parent="{ name: 'Jadwal sholat', path: '/jadwal-sholat' }"
    :title="`Jadwal Sholat ${kota!.nama}`"
    :seo-title="`Jadwal Sholat ${kota!.nama} Hari Ini`"
    :description="`Jadwal sholat ${kota!.nama}, ${kota!.provinsi} hari ini dan sebulan (${zona}): Imsak, Subuh, Dzuhur, Ashar, Maghrib, Isya, mengikuti kriteria Kemenag RI.`"
    application-category="LifestyleApplication"
    :faqs="faqs"
    :sources="KEMENAG_PARAMS.sources"
    :checked-at="KEMENAG_PARAMS.checkedAt"
  >
    <section class="card space-y-4" aria-live="polite">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <p class="font-semibold">{{ tanggalPanjang }}</p>
        <p class="text-sm text-slate-500">{{ kota!.provinsi }} · {{ zona }}</p>
      </div>
      <ClientOnly>
        <p
          v-if="berikutnya"
          class="rounded-lg bg-primary-50 p-3 text-primary-dark"
        >
          {{ WAKTU_LABEL[berikutnya.key] }} dalam
          <strong>{{ formatSisa(berikutnya.menit) }}</strong>
        </p>
      </ClientOnly>
      <div class="tabular grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          v-for="key in WAKTU"
          :key="key"
          class="rounded-xl border border-slate-200 p-3"
          :class="berikutnya?.key === key ? 'border-primary bg-primary-50' : ''"
        >
          <p class="text-sm text-slate-500">{{ WAKTU_LABEL[key] }}</p>
          <p class="text-2xl font-bold">{{ hariIni.waktu[key] }}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <NuxtLink :to="`/jadwal-imsakiyah/${kota!.slug}`" class="btn-secondary"
          >Imsakiyah Ramadan</NuxtLink
        >
        <NuxtLink :to="`/arah-kiblat?kota=${kota!.slug}`" class="btn-secondary"
          >Arah kiblat</NuxtLink
        >
      </div>
    </section>
    <AdSlot placement="result" :slug="SLUG" />
    <section class="card space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">
          Jadwal {{ MONTH_NAMES[bulan - 1] }} {{ tahun }}
        </h2>
        <button type="button" class="btn-secondary print:hidden" @click="cetak">
          Cetak
        </button>
      </div>
      <div class="-mx-4 overflow-x-auto sm:mx-0">
        <table class="tabular w-full min-w-[620px] text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="px-4 py-2 font-medium sm:px-2">Tgl</th>
              <th
                v-for="key in WAKTU"
                :key="key"
                class="px-2 py-2 text-right font-medium"
              >
                {{ WAKTU_LABEL[key] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="hari in bulanan"
              :key="hari.tanggal"
              class="border-t border-slate-100"
              :class="
                hari.tanggal === tanggal ? 'bg-primary-50 font-semibold' : ''
              "
            >
              <td class="px-4 py-1.5 sm:px-2">
                {{ Number(hari.tanggal.slice(8)) }}
              </td>
              <td
                v-for="key in WAKTU"
                :key="key"
                class="px-2 py-1.5 text-right"
              >
                {{ hari.waktu[key] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </ToolShell>
</template>
