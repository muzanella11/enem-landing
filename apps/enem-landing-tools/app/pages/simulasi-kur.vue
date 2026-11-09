<script setup lang="ts">
import { BANK_PENYALUR, CHECKED_AT, JENIS_KUR, SUMBER_KUR } from '~/data/kur';
import { downloadBlob } from '~/utils/browser-files';
import { formatRupiah } from '~/utils/format';
import { simulasiKur } from '~/utils/kur';
import { scheduleToCsv } from '~/utils/loan';

const SLUG = 'simulasi-kur';
const events = useToolEvents(SLUG);
const form = reactive({
  plafon: 50_000_000,
  tenor: 36,
  tujuan: 'modal-kerja' as 'modal-kerja' | 'investasi',
  sektor: 'produksi' as 'produksi' | 'perdagangan',
  urutan: 1,
});
onMounted(() => {
  const shared = useSharedState<typeof form>(SLUG);
  if (shared) Object.assign(form, shared);
});
const hasil = computed(() =>
  form.plafon > 0 && form.tenor > 0
    ? simulasiKur({
        plafon: form.plafon,
        tenorBulan: form.tenor,
        tujuan: form.tujuan,
        sektor: form.sektor,
        urutan: form.urutan,
      })
    : null,
);
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate(v.jenis);
  }
});
const unduh = () => {
  if (!hasil.value) return;
  downloadBlob(
    new Blob([scheduleToCsv(hasil.value.schedule)], {
      type: 'text/csv;charset=utf-8',
    }),
    `tabel-angsuran-kur-${form.plafon}-${form.tenor}-bulan.csv`,
  );
  events.download('csv');
};
const tampilJadwal = ref(false);
const faqs = [
  {
    q: 'Berapa bunga KUR 2026?',
    a: 'Menurut Permenko Perekonomian No. 1 Tahun 2026: KUR Super Mikro 3% efektif per tahun; KUR Mikro dan Kecil 6% untuk sektor produksi dan perdagangan berorientasi ekspor. Untuk perdagangan non-ekspor bunga naik sesuai urutan pinjaman KUR: 6%, 7%, 8%, lalu 9%.',
  },
  {
    q: 'Apakah angsuran KUR flat atau efektif?',
    a: 'Bunga KUR dinyatakan efektif per tahun. Tabel angsuran resmi bank (misalnya BNI) memakai angsuran tetap anuitas, dan kalkulator ini memakai cara yang sama.',
  },
  {
    q: 'Berapa plafon dan tenor KUR?',
    a: 'Super Mikro sampai Rp10 juta; Mikro di atas Rp10 juta sampai Rp100 juta; Kecil di atas Rp100 juta sampai Rp500 juta. Tenor modal kerja maksimal 3 tahun (Kecil 4 tahun), investasi maksimal 5 tahun.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Simulasi KUR"
    seo-title="Simulasi KUR 2026: Angsuran KUR BRI, Mandiri, BNI, BSI (Bunga 3%-9%)"
    description="Hitung angsuran Kredit Usaha Rakyat 2026 per bulan, total bunga, dan tabel angsuran sesuai bunga KUR Super Mikro, Mikro, dan Kecil, termasuk bunga berjenjang."
    :faqs="faqs"
    application-category="FinanceApplication"
    :sources="SUMBER_KUR"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Bank dapat menambahkan biaya lain (mis. asuransi, provisi tidak berlaku untuk KUR) dan menetapkan plafon serta tenor sesuai analisis kelayakan. Cek tabel resmi di bank penyalur.',
      'Teks Permenko Perekonomian No. 1 Tahun 2026 belum dibaca langsung; ketentuan dikutip dari pemberitaan yang merujuk informasi resmi bank.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <RupiahInput
        id="kur-plafon"
        v-model="form.plafon"
        label="Plafon pinjaman"
      />
      <div>
        <label for="kur-tenor" class="field-label">Tenor (bulan)</label>
        <select id="kur-tenor" v-model.number="form.tenor" class="field-input">
          <option v-for="t in [6, 12, 18, 24, 36, 48, 60]" :key="t" :value="t">
            {{ t }} bulan
          </option>
        </select>
      </div>
      <div>
        <label for="kur-tujuan" class="field-label">Tujuan</label>
        <select id="kur-tujuan" v-model="form.tujuan" class="field-input">
          <option value="modal-kerja">Modal kerja</option>
          <option value="investasi">Investasi</option>
        </select>
      </div>
      <div>
        <label for="kur-sektor" class="field-label">Sektor usaha</label>
        <select id="kur-sektor" v-model="form.sektor" class="field-input">
          <option value="produksi">Produksi atau perdagangan ekspor</option>
          <option value="perdagangan">Perdagangan non-ekspor</option>
        </select>
      </div>
      <div v-if="form.sektor === 'perdagangan'">
        <label for="kur-urutan" class="field-label">Pinjaman KUR ke-</label>
        <input
          id="kur-urutan"
          v-model.number="form.urutan"
          type="number"
          min="1"
          max="10"
          class="field-input"
        />
      </div>
    </form>
    <section v-if="hasil" class="card space-y-3" aria-live="polite">
      <p class="text-sm text-slate-600">
        Angsuran per bulan ({{ hasil.aturan.label }}, bunga {{ hasil.bunga }}%
        efektif)
      </p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.angsuran) }}
      </p>
      <p class="tabular text-sm">
        Total bunga {{ formatRupiah(hasil.totalInterest) }} · total bayar
        {{ formatRupiah(hasil.totalPayment) }}
      </p>
      <p v-for="p in hasil.peringatan" :key="p" class="text-sm text-amber-800">
        {{ p }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-secondary"
          @click="tampilJadwal = !tampilJadwal"
        >
          {{ tampilJadwal ? 'Sembunyikan' : 'Lihat' }} tabel angsuran
        </button>
        <button type="button" class="btn-secondary" @click="unduh">
          Unduh CSV
        </button>
        <ShareButton :tool-id="SLUG" :state="form" title="Simulasi KUR" />
      </div>
      <table v-if="tampilJadwal" class="tabular w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-1 font-medium">Bulan</th>
            <th class="py-1 text-right font-medium">Pokok</th>
            <th class="py-1 text-right font-medium">Bunga</th>
            <th class="py-1 text-right font-medium">Sisa</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in hasil.schedule"
            :key="row.month"
            class="border-t border-slate-100"
          >
            <td class="py-1">{{ row.month }}</td>
            <td class="py-1 text-right">{{ formatRupiah(row.principal) }}</td>
            <td class="py-1 text-right">{{ formatRupiah(row.interest) }}</td>
            <td class="py-1 text-right">{{ formatRupiah(row.balance) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="card text-sm">
      <h2 class="font-semibold">Jenis KUR 2026</h2>
      <ul class="mt-2 space-y-1">
        <li v-for="j in JENIS_KUR" :key="j.id">
          {{ j.label }}:
          {{
            j.id === 'super-mikro'
              ? 'sampai'
              : 'di atas ' + formatRupiah(j.plafonMin - 1) + ' sampai'
          }}
          {{ formatRupiah(j.plafonMaks) }}, tenor modal kerja
          {{ j.tenorModalKerja }} bulan, investasi {{ j.tenorInvestasi }} bulan
        </li>
      </ul>
      <p class="mt-2">
        Ajukan hanya lewat kanal resmi bank penyalur:
        <template v-for="(b, i) in BANK_PENYALUR" :key="b.nama"
          ><a :href="b.url" target="_blank" rel="noopener" class="btn-link">{{
            b.nama
          }}</a
          >{{ i < BANK_PENYALUR.length - 1 ? ', ' : '.' }}</template
        >
      </p>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-hpp" class="btn-link">Kalkulator HPP</NuxtLink
      ><NuxtLink to="/kalkulator-bep" class="btn-link">Kalkulator BEP</NuxtLink
      ><NuxtLink to="/buat-invoice" class="btn-link">Buat invoice</NuxtLink>
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
