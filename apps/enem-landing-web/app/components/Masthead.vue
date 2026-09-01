<script lang="ts" setup>
import type { Skill } from '@enem-landing/shared-types';
import SectionDivider from './SectionDivider.vue';

defineProps<{
  title: string;
  subheading: string;
  avatarUrl: string;
  skills: Skill[];
}>();

const DEFAULT_AVATAR = '/avataaars.svg';

// A broken/404ing avatarUrl (deleted upload, bad CMS entry) would
// otherwise render as a broken-image icon - the `src` check guards
// against looping if DEFAULT_AVATAR itself ever failed to load.
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== new URL(DEFAULT_AVATAR, window.location.href).href) {
    img.src = DEFAULT_AVATAR;
  }
};
</script>

<template>
  <header class="bg-[#0E7C6B] text-white text-center pt-40 lg:pt-48 pb-24 px-4">
    <div class="max-w-3xl mx-auto flex flex-col items-center">
      <img
        :src="avatarUrl"
        :alt="title"
        fetchpriority="high"
        class="w-48 lg:w-60 mb-8 rounded-full bg-white"
        @error="onImageError"
      />

      <h1 class="uppercase font-bold text-4xl lg:text-6xl leading-tight">
        {{ title }}
      </h1>

      <SectionDivider light />

      <p class="font-light text-lg lg:text-2xl mb-4">{{ subheading }}</p>

      <div class="flex flex-wrap justify-center gap-2 mt-2">
        <span
          v-for="skill in skills"
          :key="skill.id"
          class="px-3 py-1 rounded-full bg-black/10 border border-white/20 text-xs font-medium"
        >
          {{ skill.name }}
        </span>
      </div>
    </div>
  </header>
</template>
