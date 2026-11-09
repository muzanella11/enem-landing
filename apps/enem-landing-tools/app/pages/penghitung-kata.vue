<script setup lang="ts">
import { hitungTeks } from '~/utils/teks';

const SLUG = 'penghitung-kata';
const events = useToolEvents(SLUG);
const teks = ref('');
const stat = computed(() => hitungTeks(teks.value));
let dicatat = false;
watch(teks, (v) => {
  if (v.trim() && !dicatat) {
    dicatat = true;
    events.calculate();
  }
});
const menit = (m: number) =>
  m < 1 ? `${Math.max(1, Math.round(m * 60))} detik` : `${Math.round(m)} menit`;
const faqs = [
  {
    q: 'Apakah teks saya dikirim ke server?',
    a: 'Tidak. Penghitungan berjalan di browser Anda, cocok untuk tugas, skripsi, atau naskah yang belum terbit.',
  },
  {
    q: 'Bagaimana kata ulang dan angka dihitung?',
    a: 'Kata ulang dengan tanda hubung (anak-anak) dihitung satu kata. Angka dengan pemisah ribuan atau desimal (1.000.000, 3,75) juga satu kata.',
  },
  {
    q: 'Berapa kecepatan baca yang dipakai?',
    a: 'Sekitar 200 kata per menit, angka umum untuk membaca teks nonfiksi dalam hati.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Penghitung Kata"
    seo-title="Penghitung Kata dan Karakter Online (Bahasa Indonesia)"
    description="Hitung jumlah kata, karakter dengan dan tanpa spasi, kalimat, paragraf, waktu baca, dan kata yang paling sering muncul. Teks tidak dikirim ke server."
    :faqs="faqs"
    application-category="UtilitiesApplication"
    checked-at="2026-11-06"
    wide
  >
    <section class="card space-y-3">
      <label for="kata-teks" class="field-label">Teks</label>
      <textarea
        id="kata-teks"
        v-model="teks"
        rows="10"
        class="field-input"
        placeholder="Tempel atau ketik teks di sini"
      />
    </section>
    <section class="card grid gap-3 sm:grid-cols-3" aria-live="polite">
      <div>
        <p class="text-sm text-slate-600">Kata</p>
        <p class="tabular text-3xl font-bold text-primary">
          {{ stat.kata.toLocaleString('id-ID') }}
        </p>
      </div>
      <div>
        <p class="text-sm text-slate-600">Karakter</p>
        <p class="tabular text-xl font-semibold">
          {{ stat.karakter.toLocaleString('id-ID') }}
        </p>
        <p class="text-xs text-slate-500">
          {{ stat.karakterTanpaSpasi.toLocaleString('id-ID') }} tanpa spasi
        </p>
      </div>
      <div>
        <p class="text-sm text-slate-600">Kalimat / paragraf</p>
        <p class="tabular text-xl font-semibold">
          {{ stat.kalimat }} / {{ stat.paragraf }}
        </p>
        <p class="text-xs text-slate-500">
          Waktu baca sekitar {{ menit(stat.menitBaca) }}
        </p>
      </div>
    </section>
    <section v-if="stat.teratas.length" class="card">
      <h2 class="font-semibold">Kata paling sering</h2>
      <ul class="mt-2 flex flex-wrap gap-2 text-sm">
        <li
          v-for="t in stat.teratas"
          :key="t.kata"
          class="rounded bg-slate-100 px-2 py-1"
        >
          {{ t.kata }} ({{ t.jumlah }})
        </li>
      </ul>
    </section>
    <nav class="flex flex-wrap gap-4">
      <NuxtLink to="/ubah-huruf" class="btn-link">Ubah huruf kapital</NuxtLink
      ><NuxtLink to="/buat-daftar-pustaka" class="btn-link"
        >Buat daftar pustaka</NuxtLink
      >
    </nav>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
