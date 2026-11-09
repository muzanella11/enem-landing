<script setup lang="ts">
// AdSense site verification for the root domain. This tag loads no ad
// script; ads only run in blog articles when switched on (Story 56).
const { data: adsense } = await useAdsenseAccount();

useHead({
  meta: () =>
    adsense.value?.clientId
      ? [{ name: 'google-adsense-account', content: adsense.value.clientId }]
      : [],
});
</script>

<template>
  <!-- Top progress bar shown while navigating between pages (brand teal). -->
  <NuxtLoadingIndicator color="#0E7C6B" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
