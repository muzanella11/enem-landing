<script setup lang="ts">
import { MASSA_JENIS, SUMBER_MASSA_JENIS } from '~/data/bbm/massa-jenis';
import { formatRupiah } from '~/utils/format';
import {
  formatDurasi,
  hitungPesawat,
  JARAK_KE_KM,
  KECEPATAN_KE_KMH,
  type SatuanBahanBakar,
} from '~/utils/transportasi';

const SLUG = 'kalkulator-bahan-bakar-pesawat';
const events = useToolEvents(SLUG);
const form = reactive({
  jarak: 0,
  satuanJarak: 'km' as 'km' | 'nm',
  kecepatan: 450,
  satuanKecepatan: 'knot' as 'knot' | 'kmh',
  angin: 0,
  konsumsi: 0,
  satuanKonsumsi: 'kg' as SatuanBahanBakar,
  cadangan: 10,
  tangki: 0,
  harga: 0,
  satuanHarga: 'liter' as SatuanBahanBakar,
  kgPerLiter: MASSA_JENIS.avtur.kgPerLiter,
  penumpang: 0,
});
const hasil = computed(() => {
  const k = KECEPATAN_KE_KMH[form.satuanKecepatan];
  const jarakKm = form.jarak * JARAK_KE_KM[form.satuanJarak];
  return jarakKm > 0 && form.kecepatan > 0 && form.konsumsi > 0
    ? hitungPesawat({
        jarakKm,
        kecepatanKmh: form.kecepatan * k,
        anginKmh: form.angin * k,
        konsumsiPerJam: form.konsumsi,
        satuanKonsumsi: form.satuanKonsumsi,
        cadanganPersen: form.cadangan,
        tangki: form.tangki || undefined,
        harga: form.harga,
        satuanHarga: form.satuanHarga,
        kgPerLiter: form.kgPerLiter,
      })
    : null;
});
const angka = (n: number, d = 0) =>
  n.toLocaleString('id-ID', { maximumFractionDigits: d });
let dicatat = false;
watch(hasil, (v) => {
  if (v && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const faqs = [
  {
    q: 'Berapa liter avtur dalam 1 kg?',
    a: 'Avtur (Jet A-1) bermassa jenis sekitar 0,775 sampai 0,840 kg per liter pada 15 °C, jadi 1 kg sekitar 1,2 sampai 1,3 liter. Kalkulator memakai 0,8 kg/liter dan bisa diubah.',
  },
  {
    q: 'Kenapa angin memengaruhi waktu terbang?',
    a: 'Kecepatan terhadap darat = kecepatan jelajah + angin belakang (dikurangi angin depan). Angin depan 50 knot pada pesawat 450 knot membuat kecepatan darat 400 knot, sehingga waktu dan bahan bakar bertambah.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Bahan Bakar Pesawat"
    seo-title="Kalkulator Bahan Bakar Pesawat: Waktu Terbang, Avtur, dan Biaya"
    description="Perkiraan waktu terbang dengan angin, kebutuhan avtur (kg atau liter), biayanya dalam rupiah, dan jarak jelajah, untuk edukasi dan perbandingan."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    :sources="SUMBER_MASSA_JENIS"
    checked-at="2026-11-06"
    :caveats="[
      'Bukan untuk perencanaan penerbangan. Perencanaan bahan bakar resmi mengikuti aturan otoritas penerbangan, termasuk cadangan wajib, alternatif bandara, dan cuaca.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent>
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="pes-jarak" class="field-label">Jarak</label
          ><input
            id="pes-jarak"
            v-model.number="form.jarak"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div>
          <label for="pes-sj" class="field-label">Satuan</label
          ><select id="pes-sj" v-model="form.satuanJarak" class="field-input">
            <option value="km">km</option>
            <option value="nm">mil laut</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="pes-kec" class="field-label">Kecepatan jelajah</label
          ><input
            id="pes-kec"
            v-model.number="form.kecepatan"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div>
          <label for="pes-sk" class="field-label">Satuan</label
          ><select
            id="pes-sk"
            v-model="form.satuanKecepatan"
            class="field-input"
          >
            <option value="knot">knot</option>
            <option value="kmh">km/jam</option>
          </select>
        </div>
      </div>
      <div>
        <label for="pes-angin" class="field-label"
          >Angin (+ belakang, - depan, satuan sama)</label
        ><input
          id="pes-angin"
          v-model.number="form.angin"
          type="number"
          step="any"
          class="field-input"
        />
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="pes-konsumsi" class="field-label">Konsumsi per jam</label
          ><input
            id="pes-konsumsi"
            v-model.number="form.konsumsi"
            type="number"
            min="0"
            step="any"
            class="field-input"
          />
        </div>
        <div>
          <label for="pes-skon" class="field-label">Satuan</label
          ><select
            id="pes-skon"
            v-model="form.satuanKonsumsi"
            class="field-input"
          >
            <option value="kg">kg</option>
            <option value="liter">liter</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <RupiahInput
            id="pes-harga"
            v-model="form.harga"
            label="Harga avtur"
          />
        </div>
        <div>
          <label for="pes-sh" class="field-label">Per</label
          ><select id="pes-sh" v-model="form.satuanHarga" class="field-input">
            <option value="liter">liter</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      <div>
        <label for="pes-tangki" class="field-label"
          >Isi tangki (satuan konsumsi, opsional)</label
        ><input
          id="pes-tangki"
          v-model.number="form.tangki"
          type="number"
          min="0"
          step="any"
          class="field-input"
        />
      </div>
      <div>
        <label for="pes-cadangan" class="field-label">Cadangan (%)</label
        ><input
          id="pes-cadangan"
          v-model.number="form.cadangan"
          type="number"
          min="0"
          max="100"
          class="field-input"
        />
      </div>
      <div>
        <label for="pes-rho" class="field-label"
          >Massa jenis avtur (kg/liter)</label
        ><input
          id="pes-rho"
          v-model.number="form.kgPerLiter"
          type="number"
          min="0.7"
          max="0.9"
          step="0.005"
          class="field-input"
        />
        <p class="text-xs text-slate-500">
          Jet A-1: {{ MASSA_JENIS.avtur.rentang }}
        </p>
      </div>
      <div>
        <label for="pes-penumpang" class="field-label"
          >Jumlah penumpang (opsional)</label
        ><input
          id="pes-penumpang"
          v-model.number="form.penumpang"
          type="number"
          min="0"
          class="field-input"
        />
      </div>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">Biaya avtur penerbangan</p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(hasil.biayaPerjalanan) }}
      </p>
      <ul class="tabular text-sm">
        <li>
          Waktu terbang: {{ formatDurasi(hasil.jam) }} (kecepatan darat
          {{ angka(hasil.kecepatanDarat) }} km/jam)
        </li>
        <li>
          Avtur: {{ angka(hasil.perjalanan) }} {{ form.satuanKonsumsi }} +
          cadangan {{ angka(hasil.cadangan) }} ({{
            formatRupiah(hasil.biayaCadangan)
          }})
        </li>
        <li>Biaya per jam terbang: {{ formatRupiah(hasil.biayaPerJam) }}</li>
        <li v-if="form.penumpang > 0">
          Biaya avtur per penumpang:
          {{ formatRupiah(hasil.biayaPerjalanan / form.penumpang) }}
        </li>
        <li v-if="hasil.jelajahKm">
          Jarak jelajah dari isi tangki: {{ angka(hasil.jelajahKm) }} km
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
