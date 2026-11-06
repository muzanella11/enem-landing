<script setup lang="ts">
import { KARAT } from '~/data/emas/karat';
import {
  gramDariRupiah,
  nilaiEmas,
  nilaiPerhiasan,
  untungRugi,
} from '~/utils/emas';
import { formatPercent, formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-emas';
const events = useToolEvents(SLUG);
const { data: harga } = useHargaEmas();

const mode = ref<'konversi' | 'perhiasan' | 'investasi'>('konversi');
const form = reactive({
  hargaSendiri: 0,
  gram: 10,
  rupiah: 10_000_000,
  karatIndex: 4,
  kadarPersen: KARAT[4].kadarPersen as number,
  ongkos: 0,
  hargaBeli: 0,
});
watch(
  () => form.karatIndex,
  (index) => (form.kadarPersen = KARAT[index]!.kadarPersen),
);

const hargaPakai = computed(
  () => form.hargaSendiri || harga.value?.pricePerGram || 0,
);
const hasil = computed(() => ({
  nilai: nilaiEmas(form.gram, hargaPakai.value),
  gram: gramDariRupiah(form.rupiah, hargaPakai.value),
  perhiasan: nilaiPerhiasan(
    form.gram,
    form.kadarPersen,
    hargaPakai.value,
    form.ongkos,
  ),
  investasi: untungRugi(form.gram, form.hargaBeli, hargaPakai.value),
}));
let tracked = false;
watch(mode, (value) => {
  if (!tracked) {
    tracked = true;
    events.calculate(value);
  }
});

const faqs = [
  {
    q: 'Bagaimana menghitung harga perhiasan emas?',
    a: 'Berat x kadar emas x harga emas murni per gram, lalu dikurangi ongkos pembuatan bila menjual kembali. Toko bisa memakai kadar dan potongan berbeda.',
  },
  {
    q: 'Berapa kadar emas 18 karat?',
    a: 'Secara teori 18/24 atau 75%. Di toko, perhiasan "emas muda" bisa memakai kadar yang lebih rendah; cek surat pembelianmu.',
  },
];
const howTo = [
  'Periksa harga emas yang dipakai, atau isi harga sendiri.',
  'Pilih mode: konversi, perhiasan, atau untung/rugi investasi.',
  'Isi berat, kadar, atau harga beli untuk melihat hasilnya.',
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Emas"
    seo-title="Kalkulator Emas: Harga Perhiasan per Karat, Gram ke Rupiah"
    description="Hitung nilai emas per gram, harga perhiasan berdasarkan karat (24K sampai 8K), dan untung/rugi investasi emas dengan harga terkini."
    :faqs="faqs"
    :how-to="howTo"
    checked-at="2026-11-06"
    :caveats="[
      'Harga bawaan adalah harga spot internasional, bukan harga toko. Isi harga sendiri bila perlu.',
    ]"
  >
    <section class="card space-y-4">
      <p class="text-sm text-slate-600">
        Harga dipakai:
        <strong class="tabular">{{
          hargaPakai ? `${formatRupiah(hargaPakai)}/gram` : 'memuat...'
        }}</strong>
        {{ form.hargaSendiri ? '(harga sendiri)' : '(harga spot)' }}
      </p>
      <div class="max-w-xs">
        <RupiahInput
          id="harga-sendiri"
          v-model="form.hargaSendiri"
          label="Pakai harga sendiri per gram (opsional)"
        />
      </div>
      <div class="seg" role="group" aria-label="Mode">
        <button
          type="button"
          :aria-pressed="mode === 'konversi'"
          @click="mode = 'konversi'"
        >
          Gram dan rupiah
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'perhiasan'"
          @click="mode = 'perhiasan'"
        >
          Perhiasan
        </button>
        <button
          type="button"
          :aria-pressed="mode === 'investasi'"
          @click="mode = 'investasi'"
        >
          Untung/rugi
        </button>
      </div>

      <div
        v-if="mode === 'konversi'"
        class="grid gap-4 sm:grid-cols-2"
        aria-live="polite"
      >
        <div>
          <label for="gram" class="field-label">Berat (gram)</label>
          <input
            id="gram"
            v-model.number="form.gram"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
          />
          <p class="tabular mt-2 font-semibold">
            = {{ formatRupiah(hasil.nilai) }}
          </p>
        </div>
        <div>
          <RupiahInput
            id="rupiah"
            v-model="form.rupiah"
            label="Uang (rupiah)"
          />
          <p class="tabular mt-2 font-semibold">
            = {{ hasil.gram.toLocaleString('id-ID') }} gram
          </p>
        </div>
      </div>

      <div
        v-else-if="mode === 'perhiasan'"
        class="grid gap-4 sm:grid-cols-2"
        aria-live="polite"
      >
        <div>
          <label for="gram-perhiasan" class="field-label"
            >Berat perhiasan (gram)</label
          >
          <input
            id="gram-perhiasan"
            v-model.number="form.gram"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
          />
        </div>
        <div>
          <label for="karat" class="field-label">Karat</label>
          <select
            id="karat"
            v-model.number="form.karatIndex"
            class="field-input"
          >
            <option
              v-for="(item, index) in KARAT"
              :key="item.karat"
              :value="index"
            >
              {{ item.label }}
            </option>
          </select>
        </div>
        <div>
          <label for="kadar" class="field-label">Kadar (%)</label>
          <input
            id="kadar"
            v-model.number="form.kadarPersen"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="field-input"
          />
        </div>
        <RupiahInput
          id="ongkos"
          v-model="form.ongkos"
          label="Potongan/ongkos (opsional)"
        />
        <p class="tabular text-2xl font-bold text-amber-700 sm:col-span-2">
          {{ formatRupiah(hasil.perhiasan) }}
        </p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2" aria-live="polite">
        <div>
          <label for="gram-investasi" class="field-label"
            >Jumlah emas (gram)</label
          >
          <input
            id="gram-investasi"
            v-model.number="form.gram"
            type="number"
            min="0"
            step="0.01"
            class="field-input"
          />
        </div>
        <RupiahInput
          id="harga-beli"
          v-model="form.hargaBeli"
          label="Harga beli per gram"
        />
        <div v-if="form.hargaBeli" class="tabular sm:col-span-2">
          <p class="result-row">
            <span>Modal</span
            ><span>{{ formatRupiah(hasil.investasi.modal) }}</span>
          </p>
          <p class="result-row">
            <span>Nilai sekarang</span
            ><span>{{ formatRupiah(hasil.investasi.nilai) }}</span>
          </p>
          <p
            class="result-row font-semibold"
            :class="
              hasil.investasi.selisih >= 0 ? 'text-teal-800' : 'text-rose-700'
            "
          >
            <span>{{ hasil.investasi.selisih >= 0 ? 'Untung' : 'Rugi' }}</span>
            <span
              >{{ formatRupiah(Math.abs(hasil.investasi.selisih)) }} ({{
                formatPercent(Math.abs(hasil.investasi.persen))
              }})</span
            >
          </p>
          <p class="field-hint">
            Belum termasuk selisih harga jual/buyback toko.
          </p>
        </div>
      </div>
    </section>
    <NuxtLink to="/harga-emas" class="btn-link"
      >Lihat harga emas hari ini dan grafiknya</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
