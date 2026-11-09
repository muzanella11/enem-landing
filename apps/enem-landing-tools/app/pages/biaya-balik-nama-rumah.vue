<script setup lang="ts">
import {
  BPHTB,
  CHECKED_AT,
  HONOR_PPAT_MAKS_PERSEN,
  PPH_PENJUAL_PERSEN,
  SUMBER_PROPERTI,
} from '~/data/properti';
import { formatRupiah } from '~/utils/format';
import { biayaBalikNama } from '~/utils/properti';

const SLUG = 'biaya-balik-nama-rumah';
const events = useToolEvents(SLUG);
const form = reactive({
  hargaTransaksi: 0,
  njop: 0,
  npoptkp: BPHTB.npoptkpMin,
  tarifBphtbPersen: BPHTB.tarifMaksPersen,
  honorPpatPersen: HONOR_PPAT_MAKS_PERSEN,
});
const hasil = ref<ReturnType<typeof biayaBalikNama> | null>(null);
const hitung = () => {
  if (!(form.hargaTransaksi > 0)) return;
  hasil.value = biayaBalikNama({
    ...form,
    tarifBphtbPersen: Number(form.tarifBphtbPersen),
    honorPpatPersen: Number(form.honorPpatPersen),
  });
  events.calculate();
};
const faqs = [
  {
    q: 'Siapa membayar apa saat jual beli rumah?',
    a: `Pembeli membayar BPHTB (maks ${BPHTB.tarifMaksPersen}% x (NPOP - NPOPTKP)); penjual membayar PPh final ${PPH_PENJUAL_PERSEN}% dari harga. Honor PPAT dan biaya BPN biasanya disepakati, sering ditanggung pembeli.`,
  },
  {
    q: 'Berapa honor PPAT?',
    a: `Paling banyak ${HONOR_PPAT_MAKS_PERSEN}% dari harga transaksi (PP 24/2016). Banyak PPAT memasang tarif lebih rendah, tergantung nilai dan daerah.`,
  },
  {
    q: 'Apa itu NPOPTKP?',
    a: `Nilai yang tidak dikenai BPHTB, paling sedikit Rp80 juta (Rp300 juta untuk waris/hibah wasiat keluarga) menurut UU 1/2022; tiap daerah menetapkan sendiri.`,
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Biaya Balik Nama Rumah"
    seo-title="Biaya Balik Nama Sertifikat Rumah: BPHTB, PPh, PPAT, BPN"
    description="Hitung biaya jual beli dan balik nama rumah: BPHTB pembeli, PPh 2,5% penjual, honor PPAT/AJB, dan PNBP BPN, sesuai peraturan yang berlaku."
    :faqs="faqs"
    application-category="BusinessApplication"
    :sources="SUMBER_PROPERTI"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Tarif BPHTB dan NPOPTKP ditetapkan Perda tiap daerah; nilai bawaan adalah batas UU 1/2022.',
      'PNBP BPN dihitung dari NJOP sebagai nilai tanah; BPN memakai zona nilai tanah sendiri.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput
        id="bn-harga"
        v-model="form.hargaTransaksi"
        label="Harga transaksi"
      />
      <RupiahInput
        id="bn-njop"
        v-model="form.njop"
        label="NJOP (dari SPPT PBB)"
      />
      <RupiahInput
        id="bn-npoptkp"
        v-model="form.npoptkp"
        label="NPOPTKP daerah"
      />
      <div>
        <label for="bn-bphtb" class="field-label">Tarif BPHTB (%)</label
        ><input
          id="bn-bphtb"
          v-model.number="form.tarifBphtbPersen"
          type="number"
          min="0"
          :max="BPHTB.tarifMaksPersen"
          step="0.1"
          class="field-input"
        />
      </div>
      <div>
        <label for="bn-ppat" class="field-label">Honor PPAT (%)</label
        ><input
          id="bn-ppat"
          v-model.number="form.honorPpatPersen"
          type="number"
          min="0"
          :max="HONOR_PPAT_MAKS_PERSEN"
          step="0.1"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung biaya
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Perkiraan biaya pembeli</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.totalPembeli) }}
      </p>
      <ul class="tabular text-sm">
        <li>
          BPHTB (pembeli): {{ formatRupiah(hasil.bphtb) }} dari NPOP
          {{ formatRupiah(hasil.npop) }}
        </li>
        <li>Honor PPAT/AJB: {{ formatRupiah(hasil.honorPpat) }}</li>
        <li>PNBP BPN dan cek sertifikat: {{ formatRupiah(hasil.pnbpBpn) }}</li>
        <li>
          PPh final penjual ({{ PPH_PENJUAL_PERSEN }}%):
          {{ formatRupiah(hasil.pphPenjual) }}
        </li>
      </ul>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/simulasi-kpr" class="btn-link">Simulasi KPR</NuxtLink
      ><NuxtLink to="/kalkulator-pbb" class="btn-link">Kalkulator PBB</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
