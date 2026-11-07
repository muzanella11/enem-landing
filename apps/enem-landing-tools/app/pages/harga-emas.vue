<script setup lang="ts">
import { SATUAN_GRAM } from '~/data/emas/karat';
import { nilaiEmas, perubahanHarian } from '~/utils/emas';
import { formatPercent, formatRupiah } from '~/utils/format';

const SLUG = 'harga-emas';
const { data: harga, pending } = useHargaEmas();
const rentang = ref<30 | 90 | 365>(90);
const { data: riwayat } = useFetch<{ tanggal: string; pricePerGram: number }[]>(
  '/api/harga-emas/riwayat',
  {
    query: { hari: rentang },
    default: () => [],
  },
);
const perubahan = computed(() => perubahanHarian(riwayat.value ?? []));
const updated = computed(() =>
  harga.value?.updatedAt
    ? new Date(harga.value.updatedAt).toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : null,
);

const faqs = [
  {
    q: 'Harga emas apa yang ditampilkan?',
    a: 'Harga spot emas internasional (per troy ounce dalam dolar AS) yang dikonversi ke rupiah per gram. Harga jual emas batangan seperti Antam, dan harga buyback-nya, biasanya berbeda dari harga spot.',
  },
  {
    q: 'Seberapa sering harga diperbarui?',
    a: 'Harga terkini diambil ulang paling lama setiap 6 jam, dan satu harga per hari dicatat untuk grafik riwayat.',
  },
  {
    q: 'Bisa dipakai untuk menghitung zakat?',
    a: 'Bisa. Kalkulator zakat memakai harga yang sama untuk menghitung nisab 85 gram emas.',
  },
];
const howTo = [
  'Lihat harga emas per gram hari ini dan perubahannya.',
  'Bandingkan harga untuk 1, 5, 10, 25, 50, dan 100 gram.',
  'Pilih rentang grafik 30, 90, atau 365 hari.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Harga Emas Hari Ini"
    seo-title="Harga Emas Hari Ini per Gram (Spot) dan Grafik"
    description="Harga emas hari ini per gram dalam rupiah (harga spot internasional), harga per 1 sampai 100 gram, dan grafik riwayat harga."
    :faqs="faqs"
    :how-to="howTo"
    :sources="[
      { label: 'Harga spot emas: gold-api.com', url: 'https://gold-api.com/' },
      {
        label: 'Kurs USD/IDR: exchangerate-api.com',
        url: 'https://www.exchangerate-api.com/',
      },
    ]"
    checked-at="2026-11-06"
    :caveats="[
      'Yang ditampilkan adalah harga spot, bukan harga jual atau buyback toko/butik emas.',
    ]"
  >
    <section class="card space-y-4" aria-live="polite">
      <p v-if="pending" class="text-sm text-slate-500">
        Mengambil harga emas terbaru...
      </p>
      <template v-else-if="harga?.pricePerGram">
        <div>
          <p class="text-sm text-slate-500">Harga spot emas per gram</p>
          <p class="tabular text-3xl font-bold text-amber-700">
            {{ formatRupiah(harga.pricePerGram) }}
          </p>
          <p class="text-sm text-slate-600">
            <span v-if="perubahan"
              >{{ perubahan.rupiah >= 0 ? 'Naik' : 'Turun' }}
              {{ formatRupiah(Math.abs(perubahan.rupiah)) }} ({{
                formatPercent(Math.abs(perubahan.persen))
              }}) dari kemarin ·
            </span>
            <span v-if="updated"
              >per {{ updated
              }}{{
                harga.stale ? ' (harga terakhir yang tersimpan)' : ''
              }}</span
            >
          </p>
        </div>
        <table class="tabular w-full max-w-md text-sm">
          <tbody>
            <tr
              v-for="gram in SATUAN_GRAM"
              :key="gram"
              class="border-t border-slate-100"
            >
              <td class="py-1.5">{{ gram }} gram</td>
              <td class="py-1.5 text-right font-medium">
                {{ formatRupiah(nilaiEmas(gram, harga.pricePerGram)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <p v-else class="text-amber-800">
        Harga emas sedang tidak tersedia. Coba lagi beberapa saat lagi.
      </p>
    </section>
    <section class="card space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">Riwayat harga</h2>
        <div class="seg" role="group" aria-label="Rentang grafik">
          <button
            v-for="value in [30, 90, 365] as const"
            :key="value"
            type="button"
            :aria-pressed="rentang === value"
            @click="rentang = value"
          >
            {{ value }} hari
          </button>
        </div>
      </div>
      <PriceChart :points="riwayat ?? []" />
    </section>
    <section class="card text-sm">
      <NuxtLink to="/kalkulator-emas" class="btn-link"
        >Kalkulator emas: perhiasan, gram ke rupiah, untung rugi</NuxtLink
      >
      <span class="mx-2 text-slate-400">·</span>
      <NuxtLink to="/kalkulator-zakat" class="btn-link"
        >Zakat emas dan harta</NuxtLink
      >
    </section>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
