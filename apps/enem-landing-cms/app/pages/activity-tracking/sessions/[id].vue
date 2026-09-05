<script lang="ts" setup>
import type { TrackingRecordingChunkMeta } from '@enem-landing/shared-types';
import { onMounted, ref } from 'vue';
import { useGlobalSnackbar } from '@enem-landing/frontend';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Session Replay' });

const route = useRoute();
const sessionId = route.params['id'] as string;
const snackbar = useGlobalSnackbar();

const playerContainer = ref<HTMLDivElement>();
const isLoading = ref(true);
const loadError = ref<string | null>(null);

/** Chunks are gzipped server-side before upload (Story 16) - undo that here so `rrweb-player` gets plain event objects. */
const decompressGzipJson = async (url: string): Promise<unknown[]> => {
  const response = await fetch(url);
  if (!response.body) throw new Error('Empty response body');
  const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(stream).text();
  return JSON.parse(text);
};

onMounted(async () => {
  try {
    const chunks = await $fetch<TrackingRecordingChunkMeta[]>(
      `/api/tracking/sessions/${sessionId}/recording`,
    );
    if (chunks.length === 0) {
      loadError.value = 'Sesi ini belum punya chunk rekaman.';
      return;
    }

    const sorted = [...chunks].sort((a, b) => a.sequence - b.sequence);
    const eventsPerChunk = await Promise.all(
      sorted.map((chunk) => decompressGzipJson(chunk.url)),
    );
    const events = eventsPerChunk.flat();

    const { default: RrwebPlayer } = await import('rrweb-player');
    await import('rrweb-player/dist/style.css');

    if (!playerContainer.value) return;
    new RrwebPlayer({
      target: playerContainer.value,
      props: { events, width: 1000, height: 600 },
    });
  } catch (err) {
    loadError.value = 'Gagal memuat rekaman - cek koneksi ke R2 / isi bucket.';
    snackbar.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="c-form-page">
    <CPageHeader title="Session Replay" :subtitle="sessionId">
      <template #actions>
        <v-btn
          to="/activity-tracking/sessions"
          variant="text"
          prepend-icon="mdi-arrow-left"
          >Sessions</v-btn
        >
      </template>
    </CPageHeader>

    <CContentCard title="Player">
      <v-progress-circular v-if="isLoading" indeterminate />
      <p v-else-if="loadError" class="text-error">{{ loadError }}</p>
      <div v-show="!isLoading && !loadError" ref="playerContainer" />
    </CContentCard>
  </div>
</template>
