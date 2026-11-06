<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
const notFound = computed(() => props.error.statusCode === 404);

useSeoMeta({
  title: notFound.value ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan',
  robots: 'noindex, follow',
});

const { config } = useToolsConfig();
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-3xl px-4 py-16">
      <p class="text-sm font-semibold text-teal-700">{{ error.statusCode }}</p>
      <h1 class="mt-2 text-3xl font-bold">
        {{ notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan' }}
      </h1>
      <p class="mt-3 text-slate-600">
        {{
          notFound
            ? 'Tool atau halaman yang kamu cari mungkin sudah dipindah.'
            : 'Coba muat ulang halaman, atau kembali ke daftar tools.'
        }}
      </p>
      <NuxtLink to="/" class="btn-primary mt-6">Lihat semua tools</NuxtLink>
      <ul class="mt-10 grid gap-3 sm:grid-cols-2">
        <li v-for="tool in config.tools.slice(0, 6)" :key="tool.slug">
          <NuxtLink :to="`/${tool.slug}`" class="btn-link">{{
            tool.name
          }}</NuxtLink>
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>
