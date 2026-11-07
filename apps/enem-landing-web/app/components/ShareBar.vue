<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { SHARE_ICONS, buildShareLinks } from '@enem-landing/shared-utils';

/**
 * Share buttons for a blog post: round brand-colored buttons for WhatsApp,
 * Telegram, Facebook, X, and LinkedIn, plus copy link and the device share
 * sheet where the browser has one (mostly phones). Clicks are tracked as
 * `share_click` with the platform and placement only.
 */
const props = defineProps<{ url: string; title: string; placement: string }>();

const links = computed(() =>
  buildShareLinks(props.url, props.title).map((link) => ({
    ...link,
    ...SHARE_ICONS[link.platform],
  })),
);

// navigator.share only exists in the browser, so the button appears after
// hydration instead of rendering differently on the server.
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
    window.prompt('Copy this link:', props.url);
    return;
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = false), 2500);
};
onBeforeUnmount(() => clearTimeout(copiedTimer));

const roundButton =
  'w-10 h-10 rounded-full inline-flex items-center justify-center text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7C6B]';
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <a
      v-for="link in links"
      :key="link.platform"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
      :class="roundButton"
      :style="{ backgroundColor: link.color }"
      :title="`Share on ${link.label}`"
      :aria-label="`Share on ${link.label}`"
      data-track="share_click"
      :data-track-action="link.platform"
      :data-track-placement="placement"
    >
      <svg
        v-if="link.path"
        viewBox="0 0 24 24"
        class="w-5 h-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path :d="link.path" />
      </svg>
      <span v-else class="font-bold text-sm leading-none" aria-hidden="true"
        >in</span
      >
    </a>

    <button
      type="button"
      :class="[roundButton, 'bg-[#2C3E50]']"
      :title="copied ? 'Link copied' : 'Copy link'"
      :aria-label="copied ? 'Link copied' : 'Copy link'"
      data-track="share_click"
      data-track-action="copy"
      :data-track-placement="placement"
      @click="copyLink"
    >
      <svg
        viewBox="0 0 24 24"
        class="w-5 h-5"
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
      :class="[roundButton, 'bg-[#0E7C6B]']"
      title="More options"
      aria-label="More share options"
      data-track="share_click"
      data-track-action="native"
      :data-track-placement="placement"
      @click="nativeShare"
    >
      <svg
        viewBox="0 0 24 24"
        class="w-5 h-5"
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
      class="text-xs text-[#0E7C6B] font-bold transition-opacity"
      :class="copied ? 'opacity-100' : 'opacity-0'"
      aria-live="polite"
      >{{ copied ? 'Link copied' : '' }}</span
    >
  </div>
</template>
