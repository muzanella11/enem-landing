<script setup lang="ts">
import { DAFTAR_SURAT } from '~/data/surat';

const SLUG = 'buat-surat';
const faqs = [
  {
    q: 'Apakah isi surat saya dikirim ke server?',
    a: 'Tidak. Surat disusun dan dibuat PDF di browser Anda. Isian hanya disimpan di browser ini agar bisa dipakai lagi, dan bisa dihapus kapan saja.',
  },
  {
    q: 'Bisa diunduh dalam format Word?',
    a: 'Belum. Untuk mengedit di Word, gunakan tombol Salin teks lalu tempel ke dokumen Word.',
  },
];
</script>

<template>
  <ToolShell
    :slug="SLUG"
    title="Buat Surat Otomatis"
    seo-title="Buat Surat Otomatis: Lamaran Kerja, Kuasa, Pernyataan, Izin, Resign"
    description="Generator surat siap pakai: lamaran kerja, surat kuasa, surat pernyataan, izin tidak masuk, pengunduran diri, dan permohonan domisili. Unduh PDF A4/F4."
    application-category="BusinessApplication"
    :faqs="faqs"
  >
    <ul class="grid gap-4 sm:grid-cols-2">
      <li v-for="surat in DAFTAR_SURAT" :key="surat.slug">
        <NuxtLink
          :to="`/buat-surat/${surat.slug}`"
          class="card block h-full hover:ring-2 hover:ring-primary"
        >
          <h2 class="font-semibold text-primary">{{ surat.nama }}</h2>
          <p class="mt-1 text-sm text-slate-600">{{ surat.deskripsi }}</p>
        </NuxtLink>
      </li>
    </ul>
    <AdSlot placement="result" :slug="SLUG" />
  </ToolShell>
</template>
