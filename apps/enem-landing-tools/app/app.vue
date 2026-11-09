<script setup lang="ts">
// Marks the page interactive once hydration finished - used by the e2e
// suite to avoid typing into inputs before their listeners exist.
onMounted(() => {
  document.documentElement.dataset['hydrated'] = 'true';
});
</script>

<template>
  <!-- Top progress bar shown while navigating between pages (same brand teal as the landing). -->
  <NuxtLoadingIndicator color="#0E7C6B" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
