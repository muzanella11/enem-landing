<script setup lang="ts">
import { selisihHari, tambahHari } from '~/utils/tanggal';

const SLUG = 'selisih-tanggal';
const events = useToolEvents(SLUG);
const a = ref('');
const b = ref('');
const dasar = ref('');
const jumlah = ref(30);
onMounted(() => {
  const today = new Date().toISOString().slice(0, 10);
  a.value = today;
  dasar.value = today;
});
const selisih = computed(() =>
  a.value && b.value ? selisihHari(a.value, b.value) : null,
);
const hasilTambah = computed(() =>
  dasar.value ? tambahHari(dasar.value, Number(jumlah.value) || 0) : null,
);
const tanggal = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
watch(b, (value, old) => {
  if (value && !old) events.calculate('selisih');
});
const faqs = [
  {
    q: 'Apakah hari libur ikut dihitung?',
    a: 'Ya, ini selisih hari kalender. Untuk hari kerja saja, pakai tool Hitung Hari Kerja.',
  },
];
const howTo = [
  'Isi dua tanggal untuk melihat selisihnya.',
  'Atau isi tanggal dan jumlah hari untuk mencari tanggal sesudah/sebelumnya.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Selisih Tanggal"
    seo-title="Hitung Selisih Tanggal dan Tambah Hari"
    description="Hitung jumlah hari, minggu, dan bulan di antara dua tanggal, atau cari tanggal setelah ditambah/dikurangi sejumlah hari."
    application-category="LifestyleApplication"
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
  >
    <div class="grid gap-6 md:grid-cols-2">
      <section class="card space-y-3">
        <h2 class="font-semibold">Selisih dua tanggal</h2>
        <label for="tanggal-a" class="field-label">Dari tanggal</label>
        <input id="tanggal-a" v-model="a" type="date" class="field-input" />
        <label for="tanggal-b" class="field-label">Sampai tanggal</label>
        <input id="tanggal-b" v-model="b" type="date" class="field-input" />
        <p
          v-if="selisih !== null"
          class="tabular text-2xl font-bold text-teal-800"
          aria-live="polite"
        >
          {{ Math.abs(selisih).toLocaleString('id-ID') }} hari
          <span class="block text-base font-normal text-slate-600"
            >sekitar
            {{
              (Math.abs(selisih) / 7).toLocaleString('id-ID', {
                maximumFractionDigits: 1,
              })
            }}
            minggu atau
            {{
              (Math.abs(selisih) / 30.44).toLocaleString('id-ID', {
                maximumFractionDigits: 1,
              })
            }}
            bulan</span
          >
        </p>
      </section>
      <section class="card space-y-3">
        <h2 class="font-semibold">Tambah atau kurangi hari</h2>
        <label for="tanggal-dasar" class="field-label">Tanggal</label>
        <input
          id="tanggal-dasar"
          v-model="dasar"
          type="date"
          class="field-input"
        />
        <label for="jumlah-hari" class="field-label"
          >Jumlah hari (minus untuk mundur)</label
        >
        <input
          id="jumlah-hari"
          v-model.number="jumlah"
          type="number"
          class="field-input"
        />
        <p
          v-if="hasilTambah"
          class="text-xl font-bold text-teal-800"
          aria-live="polite"
        >
          {{ tanggal(hasilTambah) }}
        </p>
      </section>
    </div>
    <NuxtLink to="/hitung-hari-kerja" class="btn-link"
      >Hitung hari kerja saja (tanpa libur)</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
