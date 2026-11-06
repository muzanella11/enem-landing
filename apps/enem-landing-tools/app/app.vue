<script setup lang="ts">
// Marks the page interactive once hydration finished - used by the e2e
// suite to avoid typing into inputs before their listeners exist.
onMounted(() => {
  document.documentElement.dataset['hydrated'] = 'true';
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
