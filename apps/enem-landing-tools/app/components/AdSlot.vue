<script setup lang="ts">
import {
  loadAdsenseScript,
  preloadAdsenseScript,
  pushAdsenseSlot,
} from '@enem-landing/frontend/ads';

/**
 * One AdSense unit (Story 20). Reserves its exact height up front (no
 * layout shift), fills only after the visitor made a consent choice and
 * the slot scrolls into view, and serves non-personalized ads when
 * consent was denied. Never placed between inputs and the calculate
 * button, and never styled like a button.
 *
 * Story 56: adsbygoogle.js itself is fetched when the browser is idle
 * (not when the slot becomes visible), because the AdSense tag is what
 * shows Google's consent message to visitors from the EEA, the UK, and
 * Switzerland. Script + queue handling live in `@enem-landing/frontend/ads`.
 */
const props = defineProps<{
  placement: 'result' | 'sidebar';
  slug: string;
}>();

const HEIGHTS = { result: 280, sidebar: 600 } as const;

const { config, adsEnabledFor } = useToolsConfig();
const embed = useEmbed();
const { state: consent } = useConsent();
// False while a share-link fragment is still being removed from the URL.
const fragmentCleared = useState('share-fragment-cleared', () => true);

// Ad unit ids come from the CMS (Story 27), like the publisher id.
const slotId = computed(() =>
  props.placement === 'result'
    ? (config.value.settings.adsenseSlotResult ?? '')
    : (config.value.settings.adsenseSlotSidebar ?? ''),
);
const clientId = computed(() => config.value.settings.adsenseClientId ?? '');
const active = computed(
  () => adsEnabledFor(props.slug) && Boolean(slotId.value),
);
const height = HEIGHTS[props.placement];

const container = ref<HTMLElement | null>(null);
const visible = ref(false);
const pushed = ref(false);

const tryLoad = async () => {
  if (
    pushed.value ||
    !active.value ||
    !visible.value ||
    !fragmentCleared.value ||
    consent.value === 'unset'
  ) {
    return;
  }
  pushed.value = true;
  // Idempotent; covers a slot that scrolls into view before idle.
  loadAdsenseScript(clientId.value);
  await nextTick();
  pushAdsenseSlot({ nonPersonalized: consent.value === 'denied' });
};

onMounted(() => {
  if (!container.value) return;
  // The script reads the page URL, so it also waits for a share-link
  // fragment to be gone (Story 20).
  watch(
    fragmentCleared,
    (cleared) => {
      if (cleared) preloadAdsenseScript(clientId.value);
    },
    { immediate: true },
  );
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visible.value = true;
        observer.disconnect();
        void tryLoad();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(container.value);
  onBeforeUnmount(() => observer.disconnect());
});

watch([consent, fragmentCleared], () => void tryLoad());
</script>

<template>
  <div
    v-if="active && !embed"
    ref="container"
    class="overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50"
    :style="{ minHeight: `${height}px` }"
  >
    <p class="px-2 pt-1 text-[10px] uppercase tracking-wide text-slate-400">
      Iklan
    </p>
    <ins
      v-if="pushed"
      class="adsbygoogle"
      style="display: block; width: 100%"
      :style="{ height: `${height - 20}px` }"
      :data-ad-client="clientId"
      :data-ad-slot="slotId"
    />
  </div>
</template>
