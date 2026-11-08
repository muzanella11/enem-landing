<script lang="ts" setup>
import { computed } from 'vue';
import type { Skill } from '@enem-landing/shared-types';
import defaultAvatarSvg from '@enem-landing/frontend/assets/images/avataaars.svg?raw';
import SectionDivider from './SectionDivider.vue';

const props = defineProps<{
  title: string;
  subheading: string;
  avatarUrl: string;
  skills: Skill[];
}>();

const DEFAULT_AVATAR = '/avataaars.svg';
// The avatar is the homepage's LCP element. The default one is inlined
// (about 3 KB compressed) so it paints with the HTML instead of waiting
// for its own request, which PageSpeed measured at ~1s on mobile.
const DEFAULT_AVATAR_DATA = `data:image/svg+xml,${encodeURIComponent(defaultAvatarSvg)}`;

const isDefault = computed(() => props.avatarUrl === DEFAULT_AVATAR);
const src = computed(() =>
  isDefault.value ? DEFAULT_AVATAR_DATA : props.avatarUrl,
);
// The default SVG is 264x280, not square: reserving 240x240 made the page
// shift by ~15px once it decoded (CLS). CMS uploads are square photos.
const size = computed(() =>
  isDefault.value ? { width: 264, height: 280 } : { width: 240, height: 240 },
);

// A broken/404ing avatarUrl (deleted upload, bad CMS entry) would
// otherwise render as a broken-image icon - the `src` check guards
// against looping if the default itself ever failed to load.
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== DEFAULT_AVATAR_DATA) img.src = DEFAULT_AVATAR_DATA;
};
</script>

<template>
  <header class="bg-[#0E7C6B] text-white text-center pt-40 lg:pt-48 pb-24 px-4">
    <div class="max-w-3xl mx-auto flex flex-col items-center">
      <img
        :src="src"
        :alt="title"
        :width="size.width"
        :height="size.height"
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
