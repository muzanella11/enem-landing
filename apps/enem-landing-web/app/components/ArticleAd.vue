<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  loadAdsenseScript,
  preloadAdsenseScript,
  pushAdsenseSlot,
} from '@enem-landing/frontend/ads';

/**
 * One AdSense unit in a blog article (Story 56), following the tools hub
 * rules (Story 20): exact height reserved up front (no layout shift),
 * filled only once it scrolls near the viewport, labelled as an ad, and
 * never styled like a button. adsbygoogle.js is fetched when the browser
 * is idle so Google's consent message reaches EEA/UK/CH visitors early.
 * Personalization is left to that message (no own banner on this site).
 */
const props = defineProps<{
  clientId: string;
  slotId: string;
  placement: 'in-article' | 'end';
}>();

const HEIGHT = 280;

const container = ref<HTMLElement | null>(null);
const pushed = ref(false);

const fill = async () => {
  if (pushed.value) return;
  pushed.value = true;
  loadAdsenseScript(props.clientId);
  // Let Vue render the <ins> before AdSense looks for it.
  await nextTick();
  pushAdsenseSlot();
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  preloadAdsenseScript(props.clientId);
  if (!container.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        void fill();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(container.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <aside
    ref="container"
    class="max-w-3xl mx-auto my-10 overflow-hidden rounded-lg border border-dashed border-black/10 bg-black/[0.02]"
    :style="{ minHeight: `${HEIGHT}px` }"
    :data-ad-placement="placement"
    aria-label="Advertisement"
  >
    <p class="px-2 pt-1 text-[10px] uppercase tracking-wide text-black/40">
      Advertisement
    </p>
    <ins
      v-if="pushed"
      class="adsbygoogle"
      style="display: block; width: 100%"
      :style="{ height: `${HEIGHT - 20}px` }"
      :data-ad-client="clientId"
      :data-ad-slot="slotId"
    />
  </aside>
</template>
