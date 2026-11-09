<script setup lang="ts">
import {
  CHECKED_AT,
  DENDA_PELAYANAN,
  IURAN_MANDIRI,
  SUMBER_BPJS,
} from '~/data/bpjs-mandiri';
import {
  dendaPelayanan,
  hitungTunggakan,
  iuranKeluarga,
} from '~/utils/bpjs-mandiri';
import { formatRupiah } from '~/utils/format';

const SLUG = 'iuran-bpjs-kesehatan';
const events = useToolEvents(SLUG);
const form = reactive({ k1: 0, k2: 0, k3: 1, tunggak: 0, biayaRawatInap: 0 });
const hasil = ref<{ bulanan: number; tunggakan: number; denda: number } | null>(
  null,
);
const hitung = () => {
  const bulanan = iuranKeluarga({
    1: Number(form.k1),
    2: Number(form.k2),
    3: Number(form.k3),
  });
  hasil.value = {
    bulanan,
    tunggakan: hitungTunggakan(bulanan, Number(form.tunggak)),
    denda: dendaPelayanan(form.biayaRawatInap, Number(form.tunggak)),
  };
  events.calculate(form.tunggak ? 'tunggakan' : 'iuran');
};
const faqs = [
  {
    q: 'Berapa iuran BPJS Kesehatan mandiri sekarang?',
    a: 'Kelas 1 Rp150.000, kelas 2 Rp100.000, kelas 3 Rp42.000 per orang per bulan (peserta kelas 3 membayar Rp35.000 karena disubsidi Rp7.000). Iuran baru untuk KRIS belum ditetapkan saat pengecekan.',
  },
  {
    q: 'Apakah ada denda telat bayar BPJS?',
    a: 'Tidak ada denda bunga bulanan. Denda pelayanan dikenakan bila dalam 45 hari setelah kepesertaan aktif kembali peserta dirawat inap: 5% x biaya diagnosa awal x bulan tunggakan (maks 12 bulan), paling banyak Rp30 juta.',
  },
  {
    q: 'Berapa bulan tunggakan yang harus dilunasi?',
    a: 'Seluruh tunggakan, dengan batas paling banyak 24 bulan, agar kepesertaan aktif kembali.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Iuran BPJS Kesehatan Mandiri"
    seo-title="Kalkulator Iuran BPJS Kesehatan Mandiri, Tunggakan, dan Denda"
    description="Hitung iuran BPJS Kesehatan mandiri per kelas untuk satu keluarga, total tunggakan, dan perkiraan denda pelayanan rawat inap."
    :faqs="faqs"
    application-category="HealthApplication"
    :sources="SUMBER_BPJS"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Biaya diagnosa awal rawat inap ditentukan rumah sakit (tarif INA-CBG); isi bila sudah tahu untuk memperkirakan denda.',
      'Cek tagihan pasti di aplikasi Mobile JKN.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-3" @submit.prevent="hitung">
      <div v-for="item in IURAN_MANDIRI" :key="item.kelas">
        <label :for="`bpjs-k${item.kelas}`" class="field-label"
          >Anggota kelas {{ item.kelas }} ({{
            formatRupiah(item.dibayarPeserta)
          }})</label
        >
        <input
          :id="`bpjs-k${item.kelas}`"
          v-model.number="form[`k${item.kelas}` as 'k1']"
          type="number"
          min="0"
          max="20"
          class="field-input"
        />
      </div>
      <div>
        <label for="bpjs-tunggak" class="field-label">Bulan menunggak</label>
        <input
          id="bpjs-tunggak"
          v-model.number="form.tunggak"
          type="number"
          min="0"
          max="120"
          class="field-input"
        />
      </div>
      <div class="sm:col-span-2">
        <RupiahInput
          id="bpjs-biaya"
          v-model="form.biayaRawatInap"
          label="Biaya diagnosa awal rawat inap (opsional)"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-3">
        Hitung iuran
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Iuran keluarga per bulan</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.bulanan) }}
      </p>
      <p v-if="form.tunggak" class="tabular text-sm">
        Tunggakan yang harus dilunasi (maks
        {{ DENDA_PELAYANAN.maksBulanTunggakanDibayar }} bulan):
        <strong>{{ formatRupiah(hasil.tunggakan) }}</strong>
      </p>
      <p v-if="form.tunggak && form.biayaRawatInap" class="tabular text-sm">
        Perkiraan denda pelayanan bila rawat inap dalam
        {{ DENDA_PELAYANAN.hariSetelahAktif }} hari:
        <strong>{{ formatRupiah(hasil.denda) }}</strong>
      </p>
    </section>
    <NuxtLink to="/kalkulator-gaji-bersih" class="btn-link"
      >Iuran BPJS untuk karyawan: kalkulator gaji bersih</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
