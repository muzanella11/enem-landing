<script setup lang="ts">
import { CHECKED_AT, SUMBER_WARIS } from '~/data/fidyah';
import {
  AHLI_WARIS_KOSONG,
  hartaBersih,
  hitungFaraid,
  type AhliWaris,
} from '~/utils/faraid';
import { desimal, teks } from '~/utils/faraid/pecahan';
import { formatRupiah } from '~/utils/format';

const SLUG = 'kalkulator-waris';
const events = useToolEvents(SLUG);
const harta = reactive({ total: 0, jenazah: 0, utang: 0, wasiat: 0 });
const waris = reactive<AhliWaris>({ ...AHLI_WARIS_KOSONG });
const hasil = ref<{
  faraid: ReturnType<typeof hitungFaraid>;
  bersih: ReturnType<typeof hartaBersih>;
} | null>(null);
const BOOL = [
  ['suami', 'Suami'],
  ['ayah', 'Ayah'],
  ['ibu', 'Ibu'],
  ['kakek', 'Kakek (ayah dari ayah)'],
  ['nenekIbu', 'Nenek dari pihak ibu'],
  ['nenekAyah', 'Nenek dari pihak ayah'],
] as const;
const JUMLAH = [
  ['istri', 'Istri'],
  ['anakL', 'Anak laki-laki'],
  ['anakP', 'Anak perempuan'],
  ['cucuL', 'Cucu laki-laki dari anak laki-laki'],
  ['cucuP', 'Cucu perempuan dari anak laki-laki'],
  ['saudaraL', 'Saudara laki-laki kandung'],
  ['saudariP', 'Saudara perempuan kandung'],
  ['saudaraLSeayah', 'Saudara laki-laki seayah'],
  ['saudariSeayah', 'Saudara perempuan seayah'],
  ['saudaraSeibu', 'Saudara seibu'],
] as const;
const hitung = () => {
  hasil.value = {
    faraid: hitungFaraid(waris),
    bersih: hartaBersih(harta.total, harta.jenazah, harta.utang, harta.wasiat),
  };
  events.calculate();
};
const faqs = [
  {
    q: 'Apa yang dibagikan sebagai warisan?',
    a: 'Harta peninggalan setelah dikurangi biaya pengurusan jenazah, pelunasan utang, dan wasiat (paling banyak sepertiga dan bukan untuk ahli waris).',
  },
  {
    q: 'Apa itu aul dan radd?',
    a: 'Aul terjadi bila jumlah bagian tetap melebihi harta, sehingga semua bagian dikurangi secara proporsional. Radd terjadi bila ada sisa tanpa ashabah, sehingga sisa dikembalikan ke ahli waris bagian tetap (selain suami/istri) sebanding bagiannya.',
  },
  {
    q: 'Apakah hasil ini sah untuk pembagian waris?',
    a: 'Tidak. Ini alat bantu hitung, bukan fatwa atau putusan. Pembagian sebaiknya dikonsultasikan dengan ahli faraid atau Pengadilan Agama dan disepakati keluarga.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator Waris Islam (Faraid)"
    seo-title="Kalkulator Waris Islam (Faraid): Bagian Ahli Waris dan Alasannya"
    description="Hitung pembagian waris menurut faraid: bagian tetap, ashabah, hajb, aul, dan radd, lengkap dengan alasan bagian tiap ahli waris."
    :faqs="faqs"
    application-category="LifestyleApplication"
    :sources="SUMBER_WARIS"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Hanya kasus umum yang disepakati (pendapat jumhur). Kasus yang diperselisihkan ditandai, tidak dihitung.',
      'Tidak mencakup waris perdata (KUH Perdata) dan waris adat.',
    ]"
    wide
  >
    <section class="card grid gap-3 sm:grid-cols-2">
      <RupiahInput
        id="waris-harta"
        v-model="harta.total"
        label="Total harta peninggalan"
      />
      <RupiahInput
        id="waris-jenazah"
        v-model="harta.jenazah"
        label="Biaya pengurusan jenazah"
      />
      <RupiahInput
        id="waris-utang"
        v-model="harta.utang"
        label="Utang pewaris"
      />
      <RupiahInput
        id="waris-wasiat"
        v-model="harta.wasiat"
        label="Wasiat (maks 1/3)"
      />
    </section>
    <section class="card space-y-3">
      <p class="field-label">Ahli waris yang masih hidup</p>
      <div class="flex flex-wrap gap-4 text-sm">
        <label
          v-for="[key, label] in BOOL"
          :key="key"
          class="flex items-center gap-1"
          ><input v-model="waris[key]" type="checkbox" /> {{ label }}</label
        >
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <div v-for="[key, label] in JUMLAH" :key="key">
          <label :for="`waris-${key}`" class="field-label">{{ label }}</label>
          <input
            :id="`waris-${key}`"
            v-model.number="waris[key]"
            type="number"
            min="0"
            :max="key === 'istri' ? 4 : 30"
            class="field-input"
          />
        </div>
      </div>
      <button type="button" class="btn-primary" @click="hitung">
        Hitung pembagian
      </button>
    </section>
    <template v-if="hasil">
      <ResultNote
        text="Hasil ini alat bantu hitung, bukan fatwa atau putusan. Konsultasikan dengan ahli faraid atau Pengadilan Agama dan musyawarahkan dengan keluarga."
      />
      <section class="card space-y-3" aria-live="polite">
        <p
          v-if="hasil.faraid.perselisihan"
          class="text-3xl font-bold text-amber-800"
        >
          Perlu konsultasi ahli
        </p>
        <p v-if="hasil.faraid.perselisihan">{{ hasil.faraid.perselisihan }}</p>
        <template v-else>
          <p class="text-sm text-slate-600">
            Harta yang dibagi (setelah jenazah, utang, wasiat)
          </p>
          <p class="tabular text-3xl font-bold text-teal-800">
            {{ formatRupiah(hasil.bersih.bersih) }}
          </p>
          <p v-if="hasil.bersih.wasiatDipotong" class="text-sm text-amber-800">
            Wasiat dibatasi menjadi
            {{ formatRupiah(hasil.bersih.wasiatBerlaku) }} (1/3 harta setelah
            utang).
          </p>
          <p v-if="hasil.faraid.aul" class="text-sm">
            Terjadi <strong>aul</strong>: bagian tetap melebihi harta sehingga
            semua dikurangi proporsional.
          </p>
          <p v-if="hasil.faraid.radd" class="text-sm">
            Terjadi <strong>radd</strong>: sisa harta dikembalikan ke ahli waris
            bagian tetap.
          </p>
          <table class="tabular w-full text-sm">
            <thead class="text-left text-slate-500">
              <tr>
                <th class="py-2 font-medium">Ahli waris</th>
                <th class="py-2 text-right font-medium">Bagian</th>
                <th class="py-2 text-right font-medium">Per orang</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in hasil.faraid.bagian"
                :key="b.grup"
                class="border-t border-slate-100 align-top"
              >
                <td class="py-2">
                  {{ b.label
                  }}<span v-if="b.jumlahOrang > 1">
                    ({{ b.jumlahOrang }} orang)</span
                  >
                  <ul class="text-xs text-slate-500">
                    <li v-for="a in b.alasan" :key="a">{{ a }}</li>
                  </ul>
                </td>
                <td class="py-2 text-right">
                  {{ teks(b.bagian) }}<br />{{
                    formatRupiah(desimal(b.bagian) * hasil.bersih.bersih)
                  }}
                </td>
                <td class="py-2 text-right">
                  {{ teks(b.perOrang) }}<br />{{
                    formatRupiah(desimal(b.perOrang) * hasil.bersih.bersih)
                  }}
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="hasil.faraid.sisaTanpaPewaris.n"
            class="text-sm text-amber-800"
          >
            Sisa {{ teks(hasil.faraid.sisaTanpaPewaris) }} tidak memiliki ahli
            waris penerima dalam daftar ini (menurut jumhur ke baitul mal; KHI
            dan sebagian ulama memberikannya kepada suami/istri melalui radd).
            Konsultasikan dengan ahli.
          </p>
        </template>
        <div
          v-if="hasil.faraid.terhalang.length"
          class="text-sm text-slate-600"
        >
          <p class="font-medium">Tidak mendapat bagian (terhalang):</p>
          <ul>
            <li v-for="t in hasil.faraid.terhalang" :key="t.label">
              {{ t.label }}, karena ada {{ t.oleh }}
            </li>
          </ul>
        </div>
      </section>
    </template>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/kalkulator-zakat" class="btn-link"
        >Kalkulator zakat</NuxtLink
      ><NuxtLink to="/kalkulator-fidyah" class="btn-link"
        >Kalkulator fidyah</NuxtLink
      >
    </nav>
  </ToolShell>
</template>
