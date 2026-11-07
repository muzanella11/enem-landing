<script setup lang="ts">
// AdSense site verification for the root domain. Ads only run on
// tools.muzanella.com; this tag loads no ad script.
const { data: adsense } = await useFetch<{ clientId: string | null }>(
  '/api/adsense-account',
);

useHead({
  meta: () =>
    adsense.value?.clientId
      ? [{ name: 'google-adsense-account', content: adsense.value.clientId }]
      : [],
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
