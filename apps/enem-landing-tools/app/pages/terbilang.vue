<script setup lang="ts">
import { formatRupiah } from '~/utils/format';
import { terbilang } from '~/utils/terbilang';

const SLUG = 'terbilang';
const events = useToolEvents(SLUG);
const amount = ref(0);
const withCurrency = ref(true);
const titleCase = ref(false);
const copied = ref(false);

const words = computed(() => {
  try {
    return amount.value
      ? terbilang(amount.value, {
          currency: withCurrency.value,
          titleCase: titleCase.value,
        })
      : '';
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
});

let tracked = false;
watch(amount, (value) => {
  if (value && !tracked) {
    tracked = true;
    events.calculate();
  }
});

const copy = async () => {
  await navigator.clipboard.writeText(words.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const faqs = [
  {
    q: 'Bagaimana penulisan terbilang yang benar?',
    a: 'Contoh: Rp1.250.000 ditulis "satu juta dua ratus lima puluh ribu rupiah". Angka 1.000 ditulis "seribu", bukan "satu ribu", dan 100 ditulis "seratus".',
  },
  {
    q: 'Sampai angka berapa yang didukung?',
    a: 'Sampai 999 triliun, termasuk dua angka desimal yang dibaca sebagai sen.',
  },
];

const howTo = [
  'Ketik angka atau nominal rupiah. Gunakan koma untuk sen.',
  "Pilih apakah ingin ditambahkan kata 'rupiah' dan huruf awal kapital.",
  'Salin hasil terbilang untuk kwitansi, cek, atau dokumen lain.',
];
</script>

<template>
  <ToolShell
    :how-to="howTo"
    :slug="SLUG"
    title="Terbilang"
    seo-title="Terbilang Rupiah: Ubah Angka Jadi Kata"
    description="Ubah angka atau nominal Rupiah jadi kata dalam Bahasa Indonesia untuk kwitansi, cek, dan dokumen resmi."
    application-category="BusinessApplication"
    :faqs="faqs"
  >
    <div class="card space-y-4">
      <RupiahInput
        id="angka"
        v-model="amount"
        label="Angka"
        allow-decimal
        hint="Pakai koma untuk sen, mis. 1.500,50"
      />
      <div class="flex flex-wrap gap-4 text-sm">
        <label class="flex items-center gap-2"
          ><input
            v-model="withCurrency"
            type="checkbox"
            class="h-4 w-4 accent-teal-700"
          />
          Tambahkan "rupiah"</label
        >
        <label class="flex items-center gap-2"
          ><input
            v-model="titleCase"
            type="checkbox"
            class="h-4 w-4 accent-teal-700"
          />
          Huruf Awal Kapital</label
        >
      </div>
      <div v-if="words" aria-live="polite">
        <p class="text-sm text-slate-500">{{ formatRupiah(amount) }}</p>
        <p class="mt-1 text-lg font-medium">{{ words }}</p>
        <button type="button" class="btn-secondary mt-3" @click="copy">
          {{ copied ? 'Tersalin' : 'Salin' }}
        </button>
      </div>
    </div>
    <p class="text-sm text-slate-600">
      Butuh dokumen lengkap? Pakai
      <NuxtLink to="/buat-kwitansi" class="btn-link">pembuat kwitansi</NuxtLink>
      atau
      <NuxtLink to="/buat-invoice" class="btn-link">pembuat invoice</NuxtLink>.
    </p>
  </ToolShell>
</template>
