<script setup lang="ts">
import { KEMENAG_PARAMS } from '~/data/sholat/kemenag';
import { jadwalSholat, tanggalRamadan, zonaLabel } from '~/utils/sholat';
import { findKota } from '~/utils/sholat/kota';

const SLUG = 'jadwal-imsakiyah';
const route = useRoute();
const kota = findKota(route.params['kota'] as string);
if (!kota)
  throw createError({
    statusCode: 404,
    statusMessage: 'Kota tidak ditemukan',
    fatal: true,
  });

const zona = zonaLabel(kota.zona);
const rows = tanggalRamadan(1448).map((day) => ({
  ...day,
  jadwal: jadwalSholat(kota, day.tanggal),
}));
const tanggalLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
const cetak = () => window.print();

const faqs = [
  {
    q: `Jam berapa buka puasa di ${kota.nama}?`,
    a: `Waktu berbuka mengikuti Maghrib. Pada 1 Ramadan, Maghrib di ${kota.nama} sekitar pukul ${rows[0]?.jadwal.waktu.maghrib ?? '-'} ${zona}.`,
  },
  {
    q: 'Apakah tanggal Ramadan sudah pasti?',
    a: 'Belum. Tanggal di tabel memakai kalender Umm al-Qura sebagai perkiraan; awal Ramadan di Indonesia ditetapkan sidang isbat.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/jadwal-imsakiyah/${kota!.slug}`"
    og-key="jadwal-imsakiyah"
    :parent="{ name: 'Jadwal imsakiyah', path: '/jadwal-imsakiyah' }"
    :title="`Imsakiyah Ramadan 1448 H ${kota!.nama}`"
    :seo-title="`Jadwal Imsakiyah 2027 ${kota!.nama}`"
    :description="`Jadwal imsakiyah Ramadan 1448 H / 2027 ${kota!.nama}, ${kota!.provinsi} (${zona}): imsak, subuh, dan waktu berbuka puasa setiap hari.`"
    application-category="LifestyleApplication"
    :faqs="faqs"
    :sources="KEMENAG_PARAMS.sources"
    :checked-at="KEMENAG_PARAMS.checkedAt"
    :caveats="[
      'Tanggal Ramadan adalah perkiraan (kalender Umm al-Qura) sampai ditetapkan sidang isbat Kemenag.',
    ]"
  >
    <section class="card space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-slate-600">
          {{ kota!.provinsi }} · {{ zona }} ·
          <span class="text-amber-800">tanggal perkiraan</span>
        </p>
        <button type="button" class="btn-secondary print:hidden" @click="cetak">
          Cetak
        </button>
      </div>
      <div class="-mx-4 overflow-x-auto sm:mx-0">
        <table class="tabular w-full min-w-[560px] text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="px-4 py-2 font-medium sm:px-2">Ramadan</th>
              <th class="px-2 py-2 font-medium">Tanggal</th>
              <th class="px-2 py-2 text-right font-medium">Imsak</th>
              <th class="px-2 py-2 text-right font-medium">Subuh</th>
              <th class="px-2 py-2 text-right font-medium">Dzuhur</th>
              <th class="px-2 py-2 text-right font-medium">Ashar</th>
              <th class="px-2 py-2 text-right font-medium">Maghrib</th>
              <th class="px-4 py-2 text-right font-medium sm:px-2">Isya</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.tanggal"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-1.5 sm:px-2">{{ row.hari }}</td>
              <td class="px-2 py-1.5">{{ tanggalLabel(row.tanggal) }}</td>
              <td class="px-2 py-1.5 text-right font-semibold">
                {{ row.jadwal.waktu.imsak }}
              </td>
              <td class="px-2 py-1.5 text-right">
                {{ row.jadwal.waktu.subuh }}
              </td>
              <td class="px-2 py-1.5 text-right">
                {{ row.jadwal.waktu.dzuhur }}
              </td>
              <td class="px-2 py-1.5 text-right">
                {{ row.jadwal.waktu.ashar }}
              </td>
              <td class="px-2 py-1.5 text-right font-semibold text-primary">
                {{ row.jadwal.waktu.maghrib }}
              </td>
              <td class="px-4 py-1.5 text-right sm:px-2">
                {{ row.jadwal.waktu.isya }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <NuxtLink
        :to="`/jadwal-sholat/${kota!.slug}`"
        class="btn-link print:hidden"
        >Jadwal sholat hari ini di {{ kota!.nama }}</NuxtLink
      >
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
