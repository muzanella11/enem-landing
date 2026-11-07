<script setup lang="ts">
import { MASSA_JENIS, SUMBER_MASSA_JENIS } from '~/data/bbm/massa-jenis';
import { formatRupiah } from '~/utils/format';
import {
  formatDurasi,
  hitungKapal,
  JARAK_KE_KM,
  type SatuanBahanBakar,
} from '~/utils/transportasi';

const SLUG = 'kalkulator-bbm-kapal';
const events = useToolEvents(SLUG);
const form = reactive({
  jarak: 0,
  satuanJarak: 'nm' as 'nm' | 'km',
  knot: 10,
  konsumsi: 0,
  perHari: false,
  satuanKonsumsi: 'liter' as SatuanBahanBakar,
  cadangan: 10,
  tangki: 0,
  harga: 0,
  satuanHarga: 'liter' as SatuanBahanBakar,
  kgPerLiter: MASSA_JENIS.solarKapal.kgPerLiter,
});
const hasil = computed(() => {
  const jarakNm =
    form.satuanJarak === 'nm' ? form.jarak : form.jarak / JARAK_KE_KM.nm;
  return jarakNm > 0 && form.knot > 0 && form.konsumsi > 0
    ? hitungKapal({
        jarakNm,
        knot: form.knot,
        konsumsi: form.konsumsi,
        perHari: form.perHari,
        satuanKonsumsi: form.satuanKonsumsi,
        cadanganPersen: form.cadangan,
        tangki: form.tangki || undefined,
        harga: form.harga,
        satuanHarga: form.satuanHarga,
        kgPerLiter: form.kgPerLiter,
      })
    : null;
});
const angka = (n: number, d = 2) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: d });
const satuanLabel = { liter: 'liter', kg: 'kg', ton: 'ton' };
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const faqs = [
  {
    q: 'Berapa lama kapal menempuh jarak tertentu?',
    a: 'Waktu = jarak (mil laut) / kecepatan (knot). Contoh: 120 mil laut pada 12 knot butuh 10 jam.',
  },
  {
    q: 'Kenapa harga bahan bakar kapal per ton?',
    a: 'Bahan bakar kapal sering dijual per metrik ton. Kalkulator mengonversi liter dan ton memakai massa jenis yang bisa Anda ubah sesuai spesifikasi pemasok.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator BBM Kapal"
    seo-title="Kalkulator BBM Kapal: Waktu Tempuh (Knot), Kebutuhan dan Biaya Bahan Bakar"
    description="Hitung waktu tempuh kapal dalam knot dan mil laut, kebutuhan bahan bakar per pelayaran, biayanya dalam rupiah, dan jarak jelajah dari isi tangki."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    :sources="SUMBER_MASSA_JENIS"
    checked-at="2026-11-06"
    :caveats="[
      'Bukan untuk navigasi atau perencanaan bahan bakar operasional. Perencanaan pelayaran resmi mengikuti aturan otoritas dan nakhoda, termasuk cadangan wajib, rute, dan cuaca.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="kapal-jarak" class="field-label">Jarak</label
          ><input
            id="kapal-jarak"
            v-model.number="form.jarak"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div>
          <label for="kapal-sj" class="field-label">Satuan</label
          ><select id="kapal-sj" v-model="form.satuanJarak" class="field-input">
            <option value="nm">mil laut</option>
            <option value="km">km</option>
          </select>
        </div>
      </div>
      <div>
        <label for="kapal-knot" class="field-label">Kecepatan (knot)</label
        ><input
          id="kapal-knot"
          v-model.number="form.knot"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="kapal-konsumsi" class="field-label"
            >Konsumsi bahan bakar</label
          ><input
            id="kapal-konsumsi"
            v-model.number="form.konsumsi"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div>
          <label for="kapal-sk" class="field-label">Satuan</label
          ><select
            id="kapal-sk"
            v-model="form.satuanKonsumsi"
            class="field-input"
          >
            <option value="liter">liter</option>
            <option value="ton">ton</option>
          </select>
        </div>
        <div>
          <label for="kapal-per" class="field-label">Per</label
          ><select id="kapal-per" v-model="form.perHari" class="field-input">
            <option :value="false">jam</option>
            <option :value="true">hari</option>
          </select>
        </div>
      </div>
      <div>
        <label for="kapal-tangki" class="field-label"
          >Isi tangki ({{ satuanLabel[form.satuanKonsumsi] }}, opsional)</label
        ><input
          id="kapal-tangki"
          v-model.number="form.tangki"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <RupiahInput
            id="kapal-harga"
            v-model="form.harga"
            label="Harga bahan bakar"
          />
        </div>
        <div>
          <label for="kapal-sh" class="field-label">Per</label
          ><select id="kapal-sh" v-model="form.satuanHarga" class="field-input">
            <option value="liter">liter</option>
            <option value="ton">ton</option>
          </select>
        </div>
      </div>
      <div>
        <label for="kapal-cadangan" class="field-label">Cadangan (%)</label
        ><input
          id="kapal-cadangan"
          v-model.number="form.cadangan"
          type="number"
          min="0"
          max="100"
          class="field-input"
        />
      </div>
      <div>
        <label for="kapal-rho" class="field-label">Massa jenis (kg/liter)</label
        ><input
          id="kapal-rho"
          v-model.number="form.kgPerLiter"
          type="number"
          min="0.5"
          max="1.1"
          step="0.01"
          class="field-input"
        />
        <p class="text-xs text-slate-500">
          Distilat: {{ MASSA_JENIS.solarKapal.rentang }}
        </p>
      </div>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Biaya bahan bakar pelayaran</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.biayaPerjalanan) }}
      </p>
      <ul class="tabular text-sm">
        <li>Waktu tempuh: {{ formatDurasi(hasil.jam) }}</li>
        <li>
          Bahan bakar: {{ angka(hasil.perjalanan) }}
          {{ satuanLabel[form.satuanKonsumsi] }} + cadangan
          {{ angka(hasil.cadangan) }} ({{ formatRupiah(hasil.biayaCadangan) }})
        </li>
        <li>Biaya per mil laut: {{ formatRupiah(hasil.biayaPerNm) }}</li>
        <li v-if="hasil.jelajahNm">
          Jarak jelajah dari isi tangki: {{ angka(hasil.jelajahNm, 0) }} mil
          laut ({{ angka(hasil.jelajahNm * JARAK_KE_KM.nm, 0) }} km)
        </li>
      </ul>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-kecepatan" class="btn-link"
        >Jarak, waktu, kecepatan</NuxtLink
      ><NuxtLink to="/konversi-satuan" class="btn-link"
        >Konversi satuan</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
