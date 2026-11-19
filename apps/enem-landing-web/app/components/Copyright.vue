<script lang="ts" setup>
const year = new Date().getFullYear();
</script>

<template>
  <div class="bg-[#1A252F] text-white text-center py-4 px-4 text-xs">
    <p>Copyright &copy; Enem {{ year }}</p>
    <p>
      Nurfirliana Muzanella // Email: muzanella11@gmail.com // Phone:
      087867701092
    </p>
    <p class="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      <NuxtLink to="/#about" class="underline hover:text-[#1ABC9C]"
        >About</NuxtLink
      >
      <NuxtLink to="/#contact" class="underline hover:text-[#1ABC9C]"
        >Contact</NuxtLink
      >
      <NuxtLink to="/privacy" class="underline hover:text-[#1ABC9C]"
        >Privacy and cookies</NuxtLink
      >
      <NuxtLink to="/terms" class="underline hover:text-[#1ABC9C]"
        >Terms of use</NuxtLink
      >
    </p>
  </div>
</template>
