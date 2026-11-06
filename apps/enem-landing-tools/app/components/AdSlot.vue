<script setup lang="ts">
/**
 * One AdSense unit (Story 20). Reserves its exact height up front (no
 * layout shift), loads only after the visitor made a consent choice and
 * the slot scrolls into view, and serves non-personalized ads when
 * consent was denied. Never placed between inputs and the calculate
 * button, and never styled like a button.
 */
const props = defineProps<{
  placement: 'result' | 'sidebar';
  slug: string;
}>();

const HEIGHTS = { result: 280, sidebar: 600 } as const;

const runtime = useRuntimeConfig().public;
const { config, adsEnabledFor } = useToolsConfig();
const { state: consent } = useConsent();
// False while a share-link fragment is still being removed from the URL.
const fragmentCleared = useState('share-fragment-cleared', () => true);

const slotId = computed(() =>
  props.placement === 'result'
    ? (runtime.adsenseSlotResult as string)
    : (runtime.adsenseSlotSidebar as string),
);
const clientId = computed(() => config.value.settings.adsenseClientId ?? '');
const active = computed(
  () => adsEnabledFor(props.slug) && Boolean(slotId.value),
);
const height = HEIGHTS[props.placement];

const container = ref<HTMLElement | null>(null);
const visible = ref(false);
const pushed = ref(false);

type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number };
declare global {
  interface Window {
    adsbygoogle?: AdsQueue;
  }
}

const ensureScript = (client: string) => {
  if (document.querySelector('script[data-adsbygoogle]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset['adsbygoogle'] = '1';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
  document.head.appendChild(script);
};

const tryLoad = async () => {
  if (
    pushed.value ||
    !active.value ||
    !visible.value ||
    consent.value === 'unset'
  ) {
    return;
  }
  pushed.value = true;
  const queue: AdsQueue = (window.adsbygoogle = window.adsbygoogle || []);
  queue.requestNonPersonalizedAds = consent.value === 'denied' ? 1 : 0;
  ensureScript(clientId.value);
  await nextTick();
  try {
    queue.push({});
  } catch {
    // Ad errors never affect the tool.
  }
};

onMounted(() => {
  if (!container.value) return;
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
    v-if="active"
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
