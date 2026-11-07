<script setup lang="ts">
import {
  kenaikanUmp,
  UMP_CHECKED_AT,
  UMP_PROVINSI,
  UMP_SOURCES,
} from '~/data/upah-minimum';
import { formatPercent, formatRupiah } from '~/utils/format';

const SLUG = 'upah-minimum';
const query = ref('');
const sortBy = ref<'nama' | 'ump2026' | 'kenaikan'>('ump2026');

const rows = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  const list = UMP_PROVINSI.filter((provinsi) =>
    provinsi.nama.toLowerCase().includes(keyword),
  ).map((provinsi) => ({
    ...provinsi,
    kenaikan: kenaikanUmp(provinsi.ump2025, provinsi.ump2026),
  }));
  return list.sort((a, b) => {
    if (sortBy.value === 'nama') return a.nama.localeCompare(b.nama, 'id');
    if (sortBy.value === 'kenaikan')
      return (b.kenaikan?.persen ?? -1) - (a.kenaikan?.persen ?? -1);
    return (b.ump2026 ?? -1) - (a.ump2026 ?? -1);
  });
});

const faqs = [
  {
    q: 'Kapan UMP 2027 diumumkan?',
    a: 'UMP ditetapkan gubernur menjelang akhir tahun dan berlaku mulai 1 Januari. Untuk 2026, sebagian besar gubernur menetapkan UMP pada 24 Desember 2025. Halaman ini diperbarui begitu UMP 2027 diumumkan.',
  },
  {
    q: 'Apa beda UMP dan UMK?',
    a: 'UMP adalah upah minimum tingkat provinsi. UMK adalah upah minimum kabupaten/kota yang ditetapkan gubernur dan nilainya tidak boleh lebih rendah dari UMP provinsinya.',
  },
  {
    q: 'Apakah upah minimum berlaku untuk semua pekerja?',
    a: 'Upah minimum berlaku untuk pekerja dengan masa kerja kurang dari 1 tahun. Pekerja dengan masa kerja 1 tahun atau lebih diatur dengan struktur dan skala upah perusahaan.',
  },
];
const howTo = [
  'Cari provinsimu di tabel, atau urutkan berdasarkan nilai UMP atau kenaikannya.',
  'Buka halaman provinsi untuk detail dan catatan sumbernya.',
  'Tekan "Hitung gaji bersih" untuk langsung menghitung take home pay dari angka UMP.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="UMP 2026 dan 2027 Semua Provinsi"
    seo-title="UMP 2027 dan UMP 2026 di 38 Provinsi"
    description="Daftar upah minimum provinsi (UMP) 2026 dan 2027 di 38 provinsi, lengkap dengan kenaikan dari tahun sebelumnya dan kalkulator gaji bersih."
    application-category="FinanceApplication"
    :faqs="faqs"
    :how-to="howTo"
    :sources="[{ label: UMP_SOURCES[2026].label, url: UMP_SOURCES[2026].url }]"
    :checked-at="UMP_CHECKED_AT"
    :caveats="[
      'UMP 2027 belum diumumkan. Angka akan ditambahkan setelah penetapan resmi gubernur, tanpa perkiraan.',
      'Angka UMP 2025 dan 2026 berasal dari tabel pemberitaan Kontan dan belum dicocokkan dengan SK gubernur masing-masing. Aceh dan Papua Pegunungan tidak ada di tabel itu.',
    ]"
    wide
  >
    <div class="card space-y-4">
      <p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        UMP 2027 belum diumumkan. Halaman ini diperbarui setelah gubernur
        menetapkannya, biasanya menjelang akhir tahun.
      </p>
      <div class="flex flex-wrap items-end gap-3">
        <div class="grow">
          <label for="cari" class="field-label">Cari provinsi</label>
          <input
            id="cari"
            v-model="query"
            type="search"
            class="field-input"
            placeholder="Mis. Jawa Barat"
          />
        </div>
        <div>
          <label for="urut" class="field-label">Urutkan</label>
          <select id="urut" v-model="sortBy" class="field-input">
            <option value="ump2026">UMP 2026 tertinggi</option>
            <option value="kenaikan">Kenaikan terbesar</option>
            <option value="nama">Nama provinsi</option>
          </select>
        </div>
      </div>
      <div class="-mx-4 overflow-x-auto sm:mx-0">
        <table class="tabular w-full min-w-[640px] text-sm">
          <thead class="text-left text-slate-500">
            <tr>
              <th class="px-4 py-2 font-medium sm:px-2">Provinsi</th>
              <th class="px-2 py-2 text-right font-medium">UMP 2027</th>
              <th class="px-2 py-2 text-right font-medium">UMP 2026</th>
              <th class="px-2 py-2 text-right font-medium">UMP 2025</th>
              <th class="px-4 py-2 text-right font-medium sm:px-2">
                Kenaikan 2026
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.slug"
              class="border-t border-slate-100"
            >
              <td class="px-4 py-2 sm:px-2">
                <NuxtLink :to="`/upah-minimum/${row.slug}`" class="btn-link">{{
                  row.nama
                }}</NuxtLink>
              </td>
              <td class="px-2 py-2 text-right text-slate-500">
                {{
                  row.ump2027 ? formatRupiah(row.ump2027) : 'Belum diumumkan'
                }}
              </td>
              <td class="px-2 py-2 text-right font-medium">
                {{ row.ump2026 ? formatRupiah(row.ump2026) : 'Belum tersedia' }}
              </td>
              <td class="px-2 py-2 text-right">
                {{ row.ump2025 ? formatRupiah(row.ump2025) : '-' }}
              </td>
              <td class="px-4 py-2 text-right sm:px-2">
                {{
                  row.kenaikan
                    ? `${formatPercent(row.kenaikan.persen)} (${formatRupiah(row.kenaikan.rupiah)})`
                    : '-'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <DonationCta placement="after-result" :slug="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
