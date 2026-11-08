<script lang="ts" setup>
import { ref } from 'vue';
import type { ToolsPublicConfig } from '@enem-landing/shared-types';

/**
 * "Buy me a coffee" box at the end of a blog article: the donation options
 * from the CMS (shared with the tools site), as plain links or a QRIS image
 * shown inline, never a popup. Renders nothing when no option is set.
 * Clicks are tracked as `donate_click` with the option id and post slug.
 */
const props = defineProps<{ postSlug: string }>();

const { data: options } = await useFetch<ToolsPublicConfig['donationOptions']>(
  '/api/donation-options',
  { default: () => [] },
);

const openQris = ref<string | null>(null);
</script>

<template>
  <div
    v-if="options && options.length > 0"
    class="rounded-lg bg-amber-50 border border-amber-200 px-5 py-4"
  >
    <p class="font-semibold text-amber-900">
      <span aria-hidden="true">☕</span> Enjoyed this article? Buy me a coffee
    </p>
    <p class="text-sm text-amber-900 mt-1">
      It keeps the articles and the free tools coming.
    </p>
    <div class="flex flex-wrap items-center gap-2 mt-3">
      <template v-for="option in options" :key="option.id">
        <a
          v-if="option.url"
          :href="option.url"
          target="_blank"
          rel="noopener"
          class="px-4 py-2 rounded-full bg-amber-400 text-amber-950 text-sm font-bold hover:bg-amber-500 transition-colors"
          data-track="donate_click"
          :data-track-post-slug="props.postSlug"
          data-track-placement="article"
          :data-track-donation-option-id="option.id"
          >{{ option.label }}</a
        >
        <button
          v-else-if="option.qrisImageUrl"
          type="button"
          class="px-4 py-2 rounded-full bg-amber-400 text-amber-950 text-sm font-bold hover:bg-amber-500 transition-colors"
          :aria-expanded="openQris === option.id"
          data-track="donate_click"
          :data-track-post-slug="props.postSlug"
          data-track-placement="article"
          :data-track-donation-option-id="option.id"
          @click="openQris = openQris === option.id ? null : option.id"
        >
          {{ option.label }}
        </button>
        <span v-if="option.note" class="text-xs text-amber-900"
          >({{ option.note }})</span
        >
      </template>
    </div>
    <template v-for="option in options" :key="`qris-${option.id}`">
      <img
        v-if="openQris === option.id && option.qrisImageUrl"
        :src="option.qrisImageUrl"
        :alt="`QRIS ${option.label}`"
        class="mt-3 w-48 rounded-lg border border-amber-200 bg-white p-2"
        loading="lazy"
      />
    </template>
  </div>
</template>
