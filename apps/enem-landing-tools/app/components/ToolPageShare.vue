<script setup lang="ts">
import { SHARE_ICONS, buildShareLinks } from '@enem-landing/shared-utils';

/**
 * "Bagikan tool ini": shares the tool page itself (its canonical URL, no
 * calculator state), unlike ShareButton which shares a filled-in result.
 * Round brand-colored buttons; clicks are tracked as `tool_share` with
 * placement `page` and the platform as `action`, only ids, never input.
 */
const props = defineProps<{ toolId: string; url: string; title: string }>();

const links = computed(() =>
  buildShareLinks(props.url, props.title)
    .filter((link) => link.platform !== 'linkedin')
    .map((link) => ({ ...link, ...SHARE_ICONS[link.platform] })),
);

const canNativeShare = ref(false);
onMounted(() => {
  canNativeShare.value = typeof navigator.share === 'function';
});
const nativeShare = async () => {
  try {
    await navigator.share({ title: props.title, url: props.url });
  } catch {
    // Share sheet dismissed.
  }
};

const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(props.url);
  } catch {
    window.prompt('Salin link ini:', props.url);
    return;
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = false), 2500);
};
onBeforeUnmount(() => clearTimeout(copiedTimer));

const round =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600';
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="mr-1 text-xs font-medium text-slate-500"
      >Bagikan tool ini</span
    >
    <a
      v-for="link in links"
      :key="link.platform"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
      :class="round"
      :style="{ backgroundColor: link.color }"
      :title="`Bagikan ke ${link.label}`"
      :aria-label="`Bagikan ke ${link.label}`"
      data-track="tool_share"
      :data-track-tool-id="toolId"
      data-track-placement="page"
      :data-track-action="link.platform"
    >
      <svg
        v-if="link.path"
        viewBox="0 0 24 24"
        class="h-[18px] w-[18px]"
        fill="currentColor"
        aria-hidden="true"
      >
        <path :d="link.path" />
      </svg>
    </a>
    <button
      type="button"
      :class="[round, 'bg-slate-700']"
      :title="copied ? 'Link disalin' : 'Salin link'"
      :aria-label="copied ? 'Link disalin' : 'Salin link'"
      data-track="tool_share"
      :data-track-tool-id="toolId"
      data-track-placement="page"
      data-track-action="copy"
      @click="copyLink"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path v-if="copied" d="M20 6 9 17l-5-5" />
        <template v-else>
          <path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
          />
          <path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          />
        </template>
      </svg>
    </button>
    <button
      v-if="canNativeShare"
      type="button"
      :class="[round, 'bg-teal-700']"
      title="Opsi lain"
      aria-label="Opsi bagikan lainnya"
      data-track="tool_share"
      :data-track-tool-id="toolId"
      data-track-placement="page"
      data-track-action="native"
      @click="nativeShare"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
      </svg>
    </button>
    <span
      class="text-xs font-medium text-teal-700 transition-opacity"
      :class="copied ? 'opacity-100' : 'opacity-0'"
      aria-live="polite"
      >{{ copied ? 'Link disalin' : '' }}</span
    >
  </div>
</template>
