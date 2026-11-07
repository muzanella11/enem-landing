<script setup lang="ts">
import { CHECKED_AT, DANA_DARURAT, type StatusKeluarga } from '~/data/keuangan';
import { pmt } from '~/utils/finance';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-dana-darurat';
const events = useToolEvents(SLUG);
const form = reactive({
  pengeluaran: 0,
  status: 'lajang' as StatusKeluarga,
  pekerjaanTidakTetap: false,
  terkumpul: 0,
  bulanMenabung: 12,
});
const hasil = ref<{
  bulan: number;
  target: number;
  kurang: number;
  setoran: number;
} | null>(null);
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) {
    Object.assign(form, shared);
    hitung();
  }
});
const hitung = () => {
  if (!(form.pengeluaran > 0)) return;
  const dasar = DANA_DARURAT.find((d) => d.id === form.status)!.bulan;
  // Freelancers and business owners: add 3 months for irregular income.
  const bulan = dasar + (form.pekerjaanTidakTetap ? 3 : 0);
  const target = form.pengeluaran * bulan;
  const kurang = Math.max(0, target - form.terkumpul);
  hasil.value = {
    bulan,
    target,
    kurang,
    setoran: pmt(
      0,
      Math.max(1, Number(form.bulanMenabung)),
      target,
      form.terkumpul,
    ),
  };
  events.calculate(form.status);
};
const faqs = [
  {
    q: 'Berapa dana darurat yang ideal?',
    a: 'Pedoman umum perencana keuangan: 6 kali pengeluaran bulanan untuk lajang, 9 kali untuk menikah tanpa anak, 12 kali untuk keluarga dengan tanggungan. Tambah bila penghasilan tidak tetap.',
  },
  {
    q: 'Disimpan di mana?',
    a: 'Di tempat yang mudah dicairkan dan nilainya stabil, mis. tabungan terpisah atau deposito tenor pendek. Kalkulator ini tidak merekomendasikan produk tertentu.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Dana Darurat"
    seo-title="Kalkulator Dana Darurat: Berapa yang Ideal untuk Anda?"
    description="Hitung dana darurat ideal dari pengeluaran bulanan dan status keluarga, sisa yang perlu dikumpulkan, dan setoran per bulan."
    :faqs="faqs"
    :how-to="[
      'Isi pengeluaran wajib per bulan.',
      'Pilih status keluarga dan jenis penghasilan.',
      'Tekan Hitung dana darurat.',
    ]"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Angka bulan adalah pedoman umum, bukan aturan baku. Sesuaikan dengan kondisi Anda.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <RupiahInput
        id="dd-pengeluaran"
        v-model="form.pengeluaran"
        label="Pengeluaran wajib per bulan"
      />
      <div>
        <label for="dd-status" class="field-label">Status</label>
        <select id="dd-status" v-model="form.status" class="field-input">
          <option v-for="d in DANA_DARURAT" :key="d.id" :value="d.id">
            {{ d.label }} ({{ d.bulan }} bulan)
          </option>
        </select>
      </div>
      <label class="flex items-center gap-2 text-sm sm:col-span-2">
        <input v-model="form.pekerjaanTidakTetap" type="checkbox" /> Penghasilan
        tidak tetap (freelance/usaha), tambah 3 bulan
      </label>
      <RupiahInput
        id="dd-terkumpul"
        v-model="form.terkumpul"
        label="Sudah terkumpul"
      />
      <div>
        <label for="dd-bulan" class="field-label"
          >Target terkumpul dalam (bulan)</label
        >
        <input
          id="dd-bulan"
          v-model.number="form.bulanMenabung"
          type="number"
          min="1"
          max="120"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung dana darurat
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">
        Dana darurat ideal ({{ hasil.bulan }} bulan pengeluaran)
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.target) }}
      </p>
      <p v-if="hasil.kurang > 0" class="tabular text-sm">
        Kurang {{ formatRupiah(hasil.kurang) }}: sisihkan
        {{ formatRupiah(hasil.setoran) }} per bulan selama
        {{ form.bulanMenabung }} bulan.
      </p>
      <p v-else class="text-sm text-teal-800">Dana darurat Anda sudah cukup.</p>
      <ShareButton :tool-id="SLUG" :state="form" title="Dana darurat ideal" />
    </section>
    <NuxtLink to="/kalkulator-tabungan" class="btn-link"
      >Kalkulator target tabungan</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
