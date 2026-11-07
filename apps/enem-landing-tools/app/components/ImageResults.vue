<script setup lang="ts">
import type { ImageResult } from '~/composables/use-image-batch';
import { formatBytes } from '~/utils/files';

defineProps<{
  slug: string;
  results: ImageResult[];
  failures: { name: string; message: string }[];
  zipName: string;
  targetBytes?: number;
}>();
const emit = defineEmits<{ one: [ImageResult]; all: [] }>();
</script>

<template>
  <section class="card space-y-4">
    <p class="font-semibold">{{ results.length }} gambar siap.</p>
    <ul class="divide-y divide-slate-100 text-sm">
      <li
        v-for="result in results"
        :key="result.id"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 py-2"
      >
        <span class="min-w-0 flex-1 truncate" :title="result.name">{{
          result.name
        }}</span>
        <span class="tabular text-slate-500"
          >{{ result.width }}×{{ result.height }}</span
        >
        <span class="tabular">
          {{ formatBytes(result.originalSize) }} →
          <strong>{{ formatBytes(result.blob.size) }}</strong>
          <span
            v-if="result.blob.size < result.originalSize"
            class="text-teal-700"
          >
            (-{{
              Math.round((1 - result.blob.size / result.originalSize) * 100)
            }}%)
          </span>
        </span>
        <span
          v-if="targetBytes && !result.reachedTarget"
          class="text-xs text-amber-700"
          >belum di bawah target</span
        >
        <button type="button" class="btn-link" @click="emit('one', result)">
          Unduh
        </button>
      </li>
    </ul>
    <ul v-if="failures.length > 0" class="space-y-1 text-sm text-rose-700">
      <li v-for="failure in failures" :key="failure.name">
        {{ failure.name }}: {{ failure.message }}
      </li>
    </ul>
    <button
      v-if="results.length > 0"
      type="button"
      class="btn-primary"
      @click="emit('all')"
    >
      {{ results.length > 1 ? 'Unduh semua (ZIP)' : 'Unduh' }}
    </button>
    <p class="text-xs text-slate-500">
      Metadata foto (termasuk lokasi GPS) sudah dihapus dari hasil.
    </p>
    <DonationCta placement="after-download" :slug="slug" />
    <AdSlot placement="result" :slug="slug" />
  </section>
</template>
