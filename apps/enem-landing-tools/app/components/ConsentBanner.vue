<script setup lang="ts">
const { state, set } = useConsent();
</script>

<template>
  <div
    v-if="state === 'unset'"
    class="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    role="dialog"
    aria-live="polite"
    aria-label="Persetujuan cookie"
  >
    <div
      class="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-lg sm:flex-row sm:items-center"
    >
      <p class="flex-1 text-slate-700">
        Kami memakai cookie untuk statistik kunjungan dan iklan. Angka dan file
        yang kamu isi di tools tidak pernah dikirim.
        <NuxtLink to="/privasi" class="btn-link">Selengkapnya</NuxtLink>
      </p>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary" @click="set('denied')">
          Tolak iklan personal
        </button>
        <button type="button" class="btn-primary" @click="set('granted')">
          Setuju
        </button>
      </div>
    </div>
  </div>
</template>
