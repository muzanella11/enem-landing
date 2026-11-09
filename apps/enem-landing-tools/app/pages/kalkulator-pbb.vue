<script setup lang="ts">
import { CHECKED_AT, PBB, SUMBER_PROPERTI } from '~/data/properti';
import { formatRupiah } from '~/utils/format';
import { hitungPbb } from '~/utils/properti';

const SLUG = 'kalkulator-pbb';
const events = useToolEvents(SLUG);
const form = reactive({
  luasTanah: 0,
  njopTanahM2: 0,
  luasBangunan: 0,
  njopBangunanM2: 0,
  njoptkp: PBB.njoptkpMin,
  tarifPersen: PBB.tarifMaksPersen,
  persenNjop: 100,
});
const hasil = ref<ReturnType<typeof hitungPbb> | null>(null);
const hitung = () => {
  hasil.value = hitungPbb({
    ...form,
    tarifPersen: Number(form.tarifPersen),
    persenNjop: Number(form.persenNjop),
  });
  events.calculate();
};
const faqs = [
  {
    q: 'Bagaimana cara menghitung PBB?',
    a: 'PBB = tarif x (persentase NJOP x (NJOP - NJOPTKP)). NJOP adalah luas dikali NJOP per m² tanah dan bangunan, yang tercantum di SPPT PBB tahun lalu.',
  },
  {
    q: 'Berapa tarif PBB?',
    a: 'Paling tinggi 0,5% menurut UU 1/2022; tiap kabupaten/kota menetapkan tarif dan NJOPTKP sendiri lewat Perda, sering bertingkat menurut nilai NJOP.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Kalkulator PBB"
    seo-title="Kalkulator PBB (Pajak Bumi dan Bangunan) Sesuai UU 1/2022"
    description="Hitung PBB-P2 tahunan dari luas dan NJOP tanah dan bangunan, NJOPTKP, persentase NJOP, dan tarif daerah sesuai UU 1/2022."
    :faqs="faqs"
    application-category="BusinessApplication"
    :sources="SUMBER_PROPERTI.slice(0, 1)"
    :checked-at="CHECKED_AT"
    :caveats="[
      'Nilai bawaan tarif adalah batas maksimum UU 1/2022 dan NJOPTKP minimum; ganti dengan nilai dari SPPT atau Perda daerah Anda.',
    ]"
  >
    <form class="card grid gap-3 sm:grid-cols-2" @submit.prevent="hitung">
      <div>
        <label for="pbb-lt" class="field-label">Luas tanah (m²)</label
        ><input
          id="pbb-lt"
          v-model.number="form.luasTanah"
          type="number"
          min="0"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="pbb-njop-t"
        v-model="form.njopTanahM2"
        label="NJOP tanah per m²"
      />
      <div>
        <label for="pbb-lb" class="field-label">Luas bangunan (m²)</label
        ><input
          id="pbb-lb"
          v-model.number="form.luasBangunan"
          type="number"
          min="0"
          class="field-input"
        />
      </div>
      <RupiahInput
        id="pbb-njop-b"
        v-model="form.njopBangunanM2"
        label="NJOP bangunan per m²"
      />
      <RupiahInput id="pbb-njoptkp" v-model="form.njoptkp" label="NJOPTKP" />
      <div>
        <label for="pbb-tarif" class="field-label">Tarif PBB (%)</label
        ><input
          id="pbb-tarif"
          v-model.number="form.tarifPersen"
          type="number"
          min="0"
          :max="PBB.tarifMaksPersen"
          step="0.01"
          class="field-input"
        />
      </div>
      <div>
        <label for="pbb-persen" class="field-label"
          >Persentase NJOP ({{ PBB.persenNjopMin }}-100%)</label
        ><input
          id="pbb-persen"
          v-model.number="form.persenNjop"
          type="number"
          :min="PBB.persenNjopMin"
          max="100"
          class="field-input"
        />
      </div>
      <button type="submit" class="btn-primary sm:col-span-2">
        Hitung PBB
      </button>
    </form>
    <section v-if="hasil" class="card space-y-2" aria-live="polite">
      <p class="text-sm text-slate-600">PBB per tahun</p>
      <p class="tabular text-3xl font-bold text-primary">
        {{ formatRupiah(hasil.pbb) }}
      </p>
      <p class="tabular text-sm">
        NJOP {{ formatRupiah(hasil.njop) }}, kena pajak
        {{ formatRupiah(hasil.kenaPajak) }}, dasar pengenaan
        {{ formatRupiah(hasil.dasar) }}.
      </p>
    </section>
    <NuxtLink to="/biaya-balik-nama-rumah" class="btn-link"
      >Biaya balik nama rumah</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
