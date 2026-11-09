<script setup lang="ts">
import {
  CHECKED_AT,
  LPS,
  PAJAK_DEPOSITO,
  SUMBER_DEPOSITO,
} from '~/data/keuangan';
import { hitungDeposito } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-deposito';
const events = useToolEvents(SLUG);
const form = reactive({
  nominal: 0,
  bunga: 4.5,
  tenor: 3,
  aro: 1,
  totalSimpanan: 0,
});
const hasil = ref<ReturnType<typeof hitungDeposito> | null>(null);
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const kenaPajak = computed(
  () => Math.max(form.nominal, form.totalSimpanan) > PAJAK_DEPOSITO.bebasSampai,
);
const hitung = () => {
  if (!(form.nominal > 0)) return;
  hasil.value = hitungDeposito(
    form.nominal,
    Number(form.bunga) / 100,
    Number(form.tenor),
    {
      kenaPajak: kenaPajak.value,
      tarifPajak: PAJAK_DEPOSITO.tarif,
      putaran: Math.max(1, Number(form.aro) || 1),
    },
  );
  events.calculate(String(form.tenor));
};
const faqs = [
  {
    q: 'Berapa pajak bunga deposito?',
    a: 'PPh final 20% dari bunga (PP 131/2000). Tidak dipotong bila total deposito dan tabungan Anda di bank itu tidak lebih dari Rp7.500.000.',
  },
  {
    q: 'Apakah deposito dijamin LPS?',
    a: 'Dijamin sampai Rp2 miliar per nasabah per bank, dengan syarat bunganya tidak melebihi tingkat bunga penjaminan LPS saat itu.',
  },
  {
    q: 'Apa itu ARO?',
    a: 'Automatic Roll Over: saat jatuh tempo, deposito diperpanjang otomatis. Bila bunga ikut diputar (ARO plus bunga), bunga bersih ikut berbunga di periode berikutnya.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Deposito"
    seo-title="Kalkulator Bunga Deposito Bersih Setelah Pajak 20%"
    description="Hitung bunga deposito bersih setelah PPh final 20%, untuk tenor 1 sampai 24 bulan dan perpanjangan ARO. Lengkap dengan aturan penjaminan LPS."
    :faqs="faqs"
    :how-to="[
      'Isi nominal, bunga per tahun, dan tenor.',
      'Isi berapa kali diperpanjang (ARO).',
      'Tekan Hitung bunga.',
    ]"
    :sources="SUMBER_DEPOSITO"
    :checked-at="CHECKED_AT"
    :caveats="[
      LPS.catatan,
      'Bank menghitung bunga berdasarkan jumlah hari sebenarnya; hasil di sini memakai pendekatan bulan/12.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput
        id="dep-nominal"
        v-model="form.nominal"
        label="Nominal deposito"
      />
      <div>
        <label for="dep-bunga" class="field-label">Bunga per tahun (%)</label>
        <input
          id="dep-bunga"
          v-model.number="form.bunga"
          type="number"
          min="0"
          max="20"
          step="0.01"
          class="field-input"
        />
      </div>
      <div>
        <label for="dep-tenor" class="field-label">Tenor</label>
        <select id="dep-tenor" v-model.number="form.tenor" class="field-input">
          <option v-for="t in [1, 3, 6, 12, 24]" :key="t" :value="t">
            {{ t }} bulan
          </option>
        </select>
      </div>
      <div>
        <label for="dep-aro" class="field-label"
          >Jumlah periode (ARO plus bunga)</label
        >
        <input
          id="dep-aro"
          v-model.number="form.aro"
          type="number"
          min="1"
          max="60"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="dep-total"
        v-model="form.totalSimpanan"
        label="Total simpanan di bank ini (opsional)"
        hint="Untuk cek batas bebas pajak Rp7,5 juta."
      />
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung bunga
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Bunga bersih</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.bungaBersih) }}
      </p>
      <p class="tabular text-sm">
        Bunga kotor {{ formatRupiah(hasil.bungaKotor) }}, pajak
        {{ formatRupiah(hasil.pajak) }}
        <template v-if="!kenaPajak"
          >(tidak dipotong, simpanan di bawah Rp7,5 juta)</template
        >. Saldo akhir {{ formatRupiah(hasil.saldoAkhir) }}.
      </p>
      <p v-if="form.nominal > LPS.batas" class="text-sm text-amber-800">
        Nominal di atas batas penjaminan LPS {{ formatRupiah(LPS.batas) }} per
        nasabah per bank.
      </p>
      <ShareButton
        :tool-id="SLUG"
        :state="form"
        title="Hasil kalkulator deposito"
      />
    </section>
    <NuxtLink to="/kalkulator-investasi" class="btn-link"
      >Bandingkan dengan investasi rutin</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
