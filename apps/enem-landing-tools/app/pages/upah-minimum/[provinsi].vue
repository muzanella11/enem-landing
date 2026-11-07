<script setup lang="ts">
import {
  findProvinsi,
  kenaikanUmp,
  UMP_CHECKED_AT,
  UMP_SOURCES,
} from '~/data/upah-minimum';
import { formatPercent, formatRupiah } from '~/utils/format';
import { gajiLink } from '~/utils/gaji-link';

const SLUG = 'upah-minimum';
const route = useRoute();
const provinsi = findProvinsi(route.params['provinsi'] as string);
if (!provinsi) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Provinsi tidak ditemukan',
    fatal: true,
  });
}
const kenaikan = kenaikanUmp(provinsi.ump2025, provinsi.ump2026);
const events = useToolEvents(SLUG);

const faqs = [
  {
    q: `Berapa UMP ${provinsi.nama} 2026?`,
    a: provinsi.ump2026
      ? `UMP ${provinsi.nama} 2026 adalah ${formatRupiah(provinsi.ump2026)} per bulan, berlaku mulai 1 Januari 2026.`
      : `UMP ${provinsi.nama} 2026 belum tersedia di sumber yang kami pakai.`,
  },
  {
    q: `Kapan UMP ${provinsi.nama} 2027 diumumkan?`,
    a: 'UMP ditetapkan gubernur menjelang akhir tahun dan berlaku mulai 1 Januari. Halaman ini diperbarui setelah penetapan resmi.',
  },
  {
    q: 'Apakah UMK di kota saya bisa lebih tinggi?',
    a: 'Bisa. UMK kabupaten/kota ditetapkan gubernur dan tidak boleh lebih rendah dari UMP provinsinya.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    :path="`/upah-minimum/${provinsi!.slug}`"
    :og-key="`upah-minimum-${provinsi!.slug}`"
    :parent="{ name: 'Upah minimum', path: '/upah-minimum' }"
    :title="`UMP ${provinsi!.nama} 2026 dan 2027`"
    :seo-title="`UMP ${provinsi!.nama} 2027 dan 2026`"
    :description="`Upah minimum provinsi (UMP) ${provinsi!.nama}: nilai 2026${provinsi!.ump2026 ? ` ${formatRupiah(provinsi!.ump2026)}` : ''}, status UMP 2027, kenaikan, dan hitung gaji bersihnya.`"
    application-category="FinanceApplication"
    :faqs="faqs"
    :sources="[{ label: UMP_SOURCES[2026].label, url: UMP_SOURCES[2026].url }]"
    :checked-at="UMP_CHECKED_AT"
    :caveats="[
      'Angka berasal dari tabel pemberitaan dan belum dicocokkan dengan SK gubernur. UMP 2027 belum diumumkan.',
    ]"
  >
    <section class="card grid gap-4 sm:grid-cols-3">
      <div>
        <p class="text-sm text-slate-500">UMP 2027</p>
        <p class="text-xl font-bold text-slate-500">
          {{
            provinsi!.ump2027
              ? formatRupiah(provinsi!.ump2027)
              : 'Belum diumumkan'
          }}
        </p>
      </div>
      <div>
        <p class="text-sm text-slate-500">UMP 2026</p>
        <p class="tabular text-2xl font-bold text-teal-800">
          {{
            provinsi!.ump2026
              ? formatRupiah(provinsi!.ump2026)
              : 'Belum tersedia'
          }}
        </p>
        <p v-if="kenaikan" class="text-sm text-slate-600">
          Naik {{ formatPercent(kenaikan.persen) }} ({{
            formatRupiah(kenaikan.rupiah)
          }}) dari 2025
        </p>
      </div>
      <div>
        <p class="text-sm text-slate-500">UMP 2025</p>
        <p class="tabular text-xl font-bold">
          {{ provinsi!.ump2025 ? formatRupiah(provinsi!.ump2025) : '-' }}
        </p>
      </div>
    </section>

    <section v-if="provinsi!.ump2026" class="card space-y-3">
      <h2 class="font-semibold">
        Berapa gaji bersih dari UMP {{ provinsi!.nama }}?
      </h2>
      <p class="text-sm text-slate-600">
        Hitung potongan BPJS dan PPh 21 skema TER dari UMP
        {{ provinsi!.nama }} 2026.
      </p>
      <NuxtLink
        :to="gajiLink({ gajiPokok: provinsi!.ump2026 })"
        class="btn-primary"
        @click="events.calculate('ke-gaji')"
      >
        Hitung gaji bersih
      </NuxtLink>
    </section>

    <section class="card text-sm text-slate-600">
      <h2 class="font-semibold text-slate-900">UMK kabupaten/kota</h2>
      <p class="mt-1">
        Daftar UMK di {{ provinsi!.nama }} akan ditambahkan bertahap setelah SK
        gubernur terbit.
      </p>
      <NuxtLink to="/upah-minimum" class="btn-link mt-2 inline-block"
        >Lihat UMP semua provinsi</NuxtLink
      >
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
