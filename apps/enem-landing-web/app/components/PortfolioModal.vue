<script lang="ts" setup>
import { computed } from 'vue';
import type { Project } from '@enem-landing/shared-types';
import SectionDivider from './SectionDivider.vue';

const props = defineProps<{ project: Project | null }>();
const emit = defineEmits<{ close: [] }>();

const IMAGE_NOT_AVAILABLE = '/img/image-not-available.svg';

// A broken/404ing image URL (deleted upload, bad CMS entry) would
// otherwise render as a broken-image icon - the `src` check guards
// against looping if IMAGE_NOT_AVAILABLE itself ever failed to load.
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== new URL(IMAGE_NOT_AVAILABLE, window.location.href).href) {
    img.src = IMAGE_NOT_AVAILABLE;
  }
};

// All of the project's images, with the CMS-picked cover (if any) shown
// first - the list card only ever shows that one, so the detail view is
// where the rest become visible. Falls back to the placeholder (same as
// the portfolio list card) when the project has no images at all.
const galleryImages = computed(() => {
  const images = props.project?.image ?? [];
  const mainImage = props.project?.mainImage;
  const ordered =
    !mainImage || !images.includes(mainImage)
      ? images
      : [mainImage, ...images.filter((img) => img !== mainImage)];
  return ordered.length ? ordered : [IMAGE_NOT_AVAILABLE];
});
</script>

<template>
  <div
    v-if="project"
    class="fixed inset-0 z-50 bg-black/60 flex items-start md:items-center justify-center p-4 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-lg max-w-2xl w-full p-6 relative">
      <button
        class="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl leading-none"
        aria-label="Close"
        @click="emit('close')"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold uppercase text-center text-[#2C3E50] mb-2">
        {{ project.title }}
      </h2>
      <SectionDivider />

      <div class="flex gap-2 overflow-x-auto snap-x snap-mandatory mb-4">
        <img
          v-for="(image, index) in galleryImages"
          :key="image"
          :src="image"
          :alt="`${project.title} ${index + 1}`"
          class="h-64 w-auto max-w-full object-contain rounded bg-slate-50 shrink-0 snap-center"
          @error="onImageError"
        />
      </div>

      <p class="mb-2">
        <span class="font-semibold">Year:</span> {{ project.year }}
      </p>

      <p class="mb-2">
        <template v-if="project.url">
          <span class="font-semibold">Link:</span>
          <a
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#0E7C6B] underline ml-1"
          >
            {{ project.url }}
          </a>
        </template>
        <template v-else> Internal app, no preview link available </template>
      </p>

      <p class="mb-4">
        <span class="font-semibold">Technologies:</span>
        <span
          v-for="tech in project.technologies"
          :key="tech"
          class="inline-block px-2 py-0.5 mr-1 mt-1 rounded-full bg-[#0E7C6B]/10 text-[#0E7C6B] text-xs"
        >
          {{ tech }}
        </span>
      </p>

      <p class="text-slate-700">{{ project.description }}</p>
    </div>
  </div>
</template>
