<script setup lang="ts">
import { CHECKED_AT, HALAMAN_FEE_MARKETPLACE } from '~/data/umkm';
import { formatRupiah } from '~/utils/format';
import { hargaMinimal, pendapatanBersih } from '~/utils/umkm';

const SLUG = 'kalkulator-fee-marketplace';
const events = useToolEvents(SLUG);
const form = reactive({
  harga: 0,
  hpp: 0,
  adminPersen: 0,
  layananPersen: 0,
  biayaPerPesanan: 0,
  voucherPenjual: 0,
  ongkirDitanggung: 0,
  targetLaba: 0,
});
const hasil = ref<{
  bersih: ReturnType<typeof pendapatanBersih>;
  minimal: number;
} | null>(null);
const hitung = () => {
  if (!(form.harga > 0)) return;
  const fee = {
    adminPersen: Number(form.adminPersen),
    layananPersen: Number(form.layananPersen),
    biayaPerPesanan: form.biayaPerPesanan,
    voucherPenjual: form.voucherPenjual,
    ongkirDitanggung: form.ongkirDitanggung,
  };
  hasil.value = {
    bersih: pendapatanBersih(form.harga, form.hpp, fee),
    minimal: hargaMinimal(form.hpp, fee, form.targetLaba),
  };
  events.calculate();
};
const faqs = [
  {
    q: 'Berapa fee Shopee, Tokopedia, atau TikTok Shop?',
    a: 'Biaya admin dan layanan berbeda per kategori produk, jenis toko, dan program yang diikuti, serta sering berubah. Isi persentase sesuai halaman resmi atau rincian pesanan di aplikasi penjual Anda.',
  },
  {
    q: 'Harga minimal dihitung bagaimana?',
    a: 'Harga terendah agar setelah dipotong fee persentase, biaya per pesanan, voucher, dan ongkir yang ditanggung, laba masih sama dengan target Anda.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Fee Marketplace"
    seo-title="Kalkulator Fee Marketplace: Pendapatan Bersih dan Harga Minimal"
    description="Hitung pendapatan bersih dari penjualan di marketplace setelah biaya admin, layanan, voucher, dan ongkir, serta harga jual minimal agar tetap untung."
    :faqs="faqs"
    application-category="BusinessApplication"
    :sources="HALAMAN_FEE_MARKETPLACE"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Kalkulator tidak menyimpan tarif marketplace karena sering berubah. Ambil persentase terbaru dari halaman resmi atau aplikasi penjual.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput id="mp-harga" v-model="form.harga" label="Harga jual" />
      <RupiahInput id="mp-hpp" v-model="form.hpp" label="HPP/modal per unit" />
      <div>
        <label for="mp-admin" class="field-label">Biaya admin (%)</label>
        <input
          id="mp-admin"
          v-model.number="form.adminPersen"
          type="number"
          min="0"
          max="50"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="mp-layanan" class="field-label"
          >Biaya layanan/program (%)</label
        >
        <input
          id="mp-layanan"
          v-model.number="form.layananPersen"
          type="number"
          min="0"
          max="50"
          step="0.1"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="mp-pesanan"
        v-model="form.biayaPerPesanan"
        label="Biaya tetap per pesanan"
      />
      <RupiahInput
        id="mp-voucher"
        v-model="form.voucherPenjual"
        label="Voucher/diskon dari penjual"
      />
      <RupiahInput
        id="mp-ongkir"
        v-model="form.ongkirDitanggung"
        label="Ongkir yang ditanggung penjual"
      />
      <RupiahInput
        id="mp-target"
        v-model="form.targetLaba"
        label="Target laba per unit"
      />
      <button type="submit" class="btn-primary sm:col-span-2">Hitung</button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Laba bersih per unit</p>
      <p
        class="tabular text-3xl font-bold"
        :class="hasil.bersih.laba >= 0 ? 'text-teal-800' : 'text-rose-800'"
      >
        {{ formatRupiah(hasil.bersih.laba) }}
      </p>
      <p class="tabular text-sm">
        Potongan marketplace {{ formatRupiah(hasil.bersih.potongan) }}, dana
        diterima {{ formatRupiah(hasil.bersih.diterima) }}.
      </p>
      <p class="tabular text-sm">
        Harga jual minimal untuk target laba:
        <strong>{{ formatRupiah(hasil.minimal) }}</strong>
      </p>
    </section>
    <UmkmLinks :current="SLUG" />
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
