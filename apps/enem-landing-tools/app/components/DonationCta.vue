<script setup lang="ts">
/**
 * "Traktir kopi" (Story 20/25): the donation options from the CMS, as a
 * plain link row - never a popup or overlay. Renders nothing when no
 * option is configured. Clicks are tracked as `donate_click` with ids only.
 */
const props = withDefaults(
  defineProps<{
    placement: string;
    slug?: string;
    variant?: 'footer' | 'inline';
  }>(),
  { slug: 'hub', variant: 'inline' },
);

const { config } = useToolsConfig();
const options = computed(() => config.value.donationOptions);
const ctaText = computed(
  () => config.value.settings.donationCtaText || 'Traktir kopi',
);
const openQris = ref<string | null>(null);
</script>

<template>
  <div
    v-if="options.length > 0"
    :class="
      variant === 'inline'
        ? 'rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900'
        : 'text-sm'
    "
  >
    <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        {{
          variant === 'inline' ? 'Terbantu dengan tool ini?' : 'Suka tools ini?'
        }}
        {{ ctaText }} ☕
      </span>
      <template v-for="option in options" :key="option.id">
        <a
          v-if="option.url"
          :href="option.url"
          target="_blank"
          rel="noopener"
          class="btn-link"
          data-track="donate_click"
          :data-track-tool-id="props.slug"
          :data-track-placement="placement"
          :data-track-donation-option-id="option.id"
          >{{ option.label }}</a
        >
        <button
          v-else-if="option.qrisImageUrl"
          type="button"
          class="btn-link"
          data-track="donate_click"
          :data-track-tool-id="props.slug"
          :data-track-placement="placement"
          :data-track-donation-option-id="option.id"
          @click="openQris = openQris === option.id ? null : option.id"
        >
          {{ option.label }}
        </button>
        <span v-if="option.note" class="text-xs opacity-75"
          >({{ option.note }})</span
        >
      </template>
    </p>
    <template v-for="option in options" :key="`qris-${option.id}`">
      <img
        v-if="openQris === option.id && option.qrisImageUrl"
        :src="option.qrisImageUrl"
        :alt="`QRIS ${option.label}`"
        class="mt-3 w-48 rounded-lg border border-slate-200 bg-white p-2"
        loading="lazy"
      />
    </template>
  </div>
</template>
