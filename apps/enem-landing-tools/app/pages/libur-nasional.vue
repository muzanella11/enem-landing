<script setup lang="ts">
import { BI_KALENDER_URL, KALENDER_LIBUR, type JenisLibur } from '~/data/libur';
import { downloadBlob } from '~/utils/browser-files';
import { MONTH_NAMES } from '~/utils/format';
import { buatIcs, hariDalamMinggu, saranLongWeekend } from '~/utils/kalender';

const SLUG = 'libur-nasional';
const events = useToolEvents(SLUG);
const tahun = ref(2026);
const kalender = computed(() => KALENDER_LIBUR[tahun.value]!);
const tampilkan = reactive<Record<JenisLibur, boolean>>({
  libur: true,
  'cuti-bersama': true,
  'fakultatif-hindu': false,
});

const entries = computed(() =>
  [...kalender.value.entries]
    .filter((day) => tampilkan[day.jenis])
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
);
const perBulan = computed(() =>
  MONTH_NAMES.map((nama, index) => ({
    nama,
    items: entries.value.filter(
      (day) => Number(day.tanggal.slice(5, 7)) === index + 1,
    ),
  })).filter((bulan) => bulan.items.length > 0),
);
const longWeekend = computed(() =>
  saranLongWeekend(
    tahun.value,
    5,
    kalender.value.entries.filter((day) => day.jenis !== 'fakultatif-hindu'),
  ),
);

const NAMA_HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];
const tanggalLabel = (iso: string) =>
  `${NAMA_HARI[hariDalamMinggu(iso)]}, ${Number(iso.slice(8))} ${MONTH_NAMES[Number(iso.slice(5, 7)) - 1]}`;
const JENIS_LABEL: Record<JenisLibur, string> = {
  libur: 'Libur nasional',
  'cuti-bersama': 'Cuti bersama',
  'fakultatif-hindu': 'Libur fakultatif Hindu',
};

const now = ref('');
onMounted(() => (now.value = new Date().toISOString().slice(0, 10)));
const berikutnya = computed(() =>
  entries.value.find(
    (day) => day.jenis !== 'fakultatif-hindu' && day.tanggal >= now.value,
  ),
);
const hariLagi = computed(() =>
  berikutnya.value && now.value
    ? Math.round(
        (Date.parse(berikutnya.value.tanggal) - Date.parse(now.value)) /
          86_400_000,
      )
    : null,
);

const unduhIcs = () => {
  const ics = buatIcs(
    entries.value,
    `Libur nasional dan cuti bersama ${tahun.value}`,
  );
  downloadBlob(
    new Blob([ics], { type: 'text/calendar;charset=utf-8' }),
    `libur-nasional-${tahun.value}.ics`,
  );
  events.download('ics');
};

const faqs = [
  {
    q: 'Dari mana data libur nasional ini?',
    a: 'Dari kalender Hari Libur dan Cuti Bersama Bank Indonesia, yang mengacu pada SKB Menteri Agama, Menteri Ketenagakerjaan, dan MenPAN-RB.',
  },
  {
    q: 'Kapan libur nasional dan cuti bersama 2027 tersedia?',
    a: 'Setelah Bank Indonesia menerbitkan kalender 2027. Kalender 2026 terbit pada akhir Desember 2025; halaman ini diperbarui begitu kalender 2027 terbit.',
  },
  {
    q: 'Apa arti tanda "dapat berubah"?',
    a: 'Tanggal Idul Fitri, Idul Adha, dan Tahun Baru Islam mengikuti keputusan pemerintah (sidang isbat), sehingga bisa bergeser.',
  },
  {
    q: 'Apakah cuti bersama memotong cuti tahunan?',
    a: 'Bagi pekerja swasta, pelaksanaan cuti bersama mengikuti kebijakan perusahaan dan dapat mengurangi hak cuti tahunan.',
  },
];
const howTo = [
  'Pilih tahun dan jenis libur yang ingin ditampilkan.',
  'Lihat daftar per bulan, hitung mundur ke libur berikutnya, dan saran long weekend.',
  'Unduh file .ics untuk dimasukkan ke Google Calendar atau kalender iPhone.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Libur Nasional dan Cuti Bersama 2026 dan 2027"
    seo-title="Libur Nasional dan Cuti Bersama 2027 dan 2026"
    description="Daftar libur nasional dan cuti bersama 2026 dan 2027 dari kalender Bank Indonesia, lengkap dengan saran long weekend dan file kalender .ics."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="
      kalender.sumber
        ? [{ label: kalender.sumber.label, url: kalender.sumber.url }]
        : [{ label: 'Kalender Bank Indonesia', url: BI_KALENDER_URL }]
    "
    :checked-at="kalender.sumber?.checkedAt ?? '2026-11-06'"
    :caveats="kalender.dasarHukum ? [kalender.dasarHukum] : []"
    wide
  >
    <div class="card space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="seg" role="group" aria-label="Tahun">
          <button
            v-for="year in [2026, 2027]"
            :key="year"
            type="button"
            :aria-pressed="tahun === year"
            @click="tahun = year"
          >
            {{ year }}
          </button>
        </div>
        <label
          v-for="(label, jenis) in JENIS_LABEL"
          :key="jenis"
          class="flex items-center gap-2 text-sm"
        >
          <input
            v-model="tampilkan[jenis]"
            type="checkbox"
            class="h-4 w-4 accent-teal-700"
          />
          {{ label }}
        </label>
      </div>

      <p
        v-if="kalender.status === 'menunggu'"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        Menunggu publikasi kalender Bank Indonesia {{ tahun }}. Kalender tahun
        sebelumnya terbit sekitar akhir Desember.
        <a
          :href="BI_KALENDER_URL"
          target="_blank"
          rel="noopener"
          class="btn-link"
          >Cek situs BI</a
        >
      </p>

      <template v-else>
        <ClientOnly>
          <p
            v-if="berikutnya && hariLagi !== null"
            class="rounded-lg bg-teal-50 p-3 text-teal-900"
          >
            Libur berikutnya: <strong>{{ berikutnya.nama }}</strong> ({{
              tanggalLabel(berikutnya.tanggal)
            }}), {{ hariLagi === 0 ? 'hari ini' : `${hariLagi} hari lagi` }}.
          </p>
        </ClientOnly>
        <div class="grid gap-4 md:grid-cols-2">
          <section v-for="bulan in perBulan" :key="bulan.nama">
            <h2 class="font-semibold">{{ bulan.nama }} {{ tahun }}</h2>
            <ul class="mt-1 divide-y divide-slate-100 text-sm">
              <li
                v-for="day in bulan.items"
                :key="day.tanggal + day.jenis"
                class="flex flex-wrap items-baseline justify-between gap-2 py-1.5"
              >
                <span>
                  <span class="font-medium">{{
                    tanggalLabel(day.tanggal)
                  }}</span>
                  · {{ day.nama }}
                  <span v-if="day.dapatBerubah" class="text-xs text-amber-700"
                    >(dapat berubah)</span
                  >
                </span>
                <span
                  class="rounded-full px-2 py-0.5 text-xs"
                  :class="
                    day.jenis === 'libur'
                      ? 'bg-rose-100 text-rose-800'
                      : day.jenis === 'cuti-bersama'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                  "
                  >{{ JENIS_LABEL[day.jenis] }}</span
                >
              </li>
            </ul>
          </section>
        </div>
        <button type="button" class="btn-secondary" @click="unduhIcs">
          Unduh ke kalender (.ics)
        </button>
      </template>
    </div>

    <section v-if="longWeekend.length" class="card space-y-3">
      <h2 class="font-semibold">
        Saran long weekend {{ tahun }} (pola 5 hari kerja)
      </h2>
      <ul class="space-y-2 text-sm">
        <li
          v-for="item in longWeekend"
          :key="item.mulai"
          class="rounded-xl bg-slate-50 p-3"
        >
          <strong
            >{{ tanggalLabel(item.mulai) }} sampai
            {{ tanggalLabel(item.selesai) }}</strong
          >: {{ item.totalHari }} hari libur
          <span v-if="item.cutiDiperlukan.length"
            >dengan mengambil cuti
            {{ item.cutiDiperlukan.map(tanggalLabel).join(' dan ') }}</span
          >
          <span v-else>tanpa cuti tambahan</span>.
          <span class="block text-slate-500">{{
            [...new Set(item.libur.map((day) => day.nama))].join(', ')
          }}</span>
        </li>
      </ul>
      <NuxtLink to="/hitung-hari-kerja" class="btn-link"
        >Hitung hari kerja antara dua tanggal</NuxtLink
      >
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
