<script setup lang="ts">
/**
 * Header "Traktir kopi" button: the footer CTA alone was out of sight, so
 * this keeps it one tap away on every page. It opens a small dropdown under
 * the button (not a modal, nothing covers the tool) with the same donation
 * options as DonationCta. Renders nothing when no option is configured.
 */
const { config } = useToolsConfig();
const embed = useEmbed();
const route = useRoute();
const hasOptions = computed(() => config.value.donationOptions.length > 0);
const ctaText = computed(
  () => config.value.settings.donationCtaText || 'Traktir kopi',
);
// Tool pages are /<slug> (or /<slug>/...), the hub and static pages use "hub".
const slug = computed(() => {
  const first = route.path.split('/')[1] ?? '';
  return config.value.tools.some((tool) => tool.slug === first) ? first : 'hub';
});

const menu = ref<HTMLDetailsElement | null>(null);
const close = () => menu.value?.removeAttribute('open');
const onDocumentClick = (event: MouseEvent) => {
  if (menu.value && !menu.value.contains(event.target as Node)) close();
};
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};
onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeydown);
});
watch(() => route.fullPath, close);
</script>

<template>
  <details v-if="hasOptions && !embed" ref="menu" class="relative">
    <summary
      class="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-200 [&::-webkit-details-marker]:hidden"
    >
      <span aria-hidden="true">☕</span>
      <span>{{ ctaText }}</span>
    </summary>
    <div
      class="absolute right-0 z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
    >
      <DonationCta placement="header" :slug="slug" />
    </div>
  </details>
</template>
