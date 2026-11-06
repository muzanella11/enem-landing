<script setup lang="ts">
import {
  BIAYA_NON_PNBP,
  CHECKED_AT,
  SUMBER_PNBP,
  TARIF_SIM,
} from '~/data/kendaraan';
import { formatRupiah } from '~/utils/format';

const SLUG = 'biaya-sim';
const events = useToolEvents(SLUG);
const golongan = ref<string>('A');
const layanan = ref<'baru' | 'perpanjang'>('perpanjang');
const tarif = computed(() =>
  TARIF_SIM.find((t) => t.golongan === golongan.value)!,
);
watch([golongan, layanan], () =>
  events.calculate(`${layanan.value}-${golongan.value}`),
);
const faqs = [
  {
    q: 'Berapa biaya perpanjang SIM A dan SIM C?',
    a: 'Menurut PP 76/2020, PNBP perpanjangan SIM A Rp80.000 dan SIM C Rp75.000. Pembuatan baru SIM A Rp120.000 dan SIM C Rp100.000.',
  },
  {
    q: 'Apakah ada biaya lain selain PNBP?',
    a: BIAYA_NON_PNBP,
  },
  {
    q: 'Bagaimana jika SIM sudah mati?',
    a: 'SIM yang lewat masa berlaku tidak bisa diperpanjang dan harus membuat baru, termasuk ujian teori dan praktik, dengan tarif penerbitan baru.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Biaya Buat dan Perpanjang SIM"
    seo-title="Biaya Buat dan Perpanjang SIM A, B, C, D (Tarif Resmi PP 76/2020)"
    description="Tarif resmi PNBP pembuatan dan perpanjangan SIM semua golongan menurut PP 76/2020, plus catatan biaya kesehatan dan psikologi."
    :faqs="faqs"
    :sources="SUMBER_PNBP"
    :checked-at="CHECKED_AT"
    :caveats="[
      BIAYA_NON_PNBP,
      'PP 76/2020 memungkinkan tarif Rp0 untuk kondisi tertentu.',
    ]"
  >
    <section class="card grid gap-3 sm:grid-cols-2">
      <div>
        <label for="sim-golongan" class="field-label">Golongan SIM</label>
        <select id="sim-golongan" v-model="golongan" class="field-input">
          <option v-for="t in TARIF_SIM" :key="t.golongan" :value="t.golongan">
            {{ t.golongan }}: {{ t.untuk }}
          </option>
        </select>
      </div>
      <div>
        <label for="sim-layanan" class="field-label">Layanan</label>
        <select id="sim-layanan" v-model="layanan" class="field-input">
          <option value="perpanjang">Perpanjangan</option>
          <option value="baru">Pembuatan baru</option>
        </select>
      </div>
    </section>
    <section class="card" aria-live="polite">
      <p class="text-sm text-slate-600">
        PNBP {{ layanan === 'baru' ? 'pembuatan' : 'perpanjangan' }} SIM
        {{ golongan }}
      </p>
      <p class="tabular text-3xl font-bold text-teal-800">
        {{ formatRupiah(tarif[layanan]) }}
      </p>
    </section>
    <section class="card">
      <h2 class="font-semibold">Tabel tarif SIM (PP 76/2020)</h2>
      <table class="tabular mt-2 w-full text-sm">
        <thead class="text-left text-slate-500">
          <tr>
            <th class="py-2 font-medium">Golongan</th>
            <th class="py-2 text-right font-medium">Baru</th>
            <th class="py-2 text-right font-medium">Perpanjang</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in TARIF_SIM"
            :key="t.golongan"
            class="border-t border-slate-100"
          >
            <td class="py-2">SIM {{ t.golongan }}</td>
            <td class="py-2 text-right">{{ formatRupiah(t.baru) }}</td>
            <td class="py-2 text-right">{{ formatRupiah(t.perpanjang) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <NuxtLink to="/biaya-stnk-bpkb" class="btn-link"
      >Biaya STNK, plat, dan BPKB</NuxtLink
    >
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
