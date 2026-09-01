<script lang="ts" setup>
withDefaults(defineProps<{ light?: boolean }>(), { light: false });
</script>

<template>
  <div class="w-full max-w-[7rem] mx-auto flex items-center gap-4 my-5">
    <span class="flex-1 h-1 rounded" :class="light ? 'bg-white' : 'bg-[#2C3E50]'" />
    <span class="text-xl" :class="light ? 'text-white' : 'text-[#2C3E50]'">&#9733;</span>
    <span class="flex-1 h-1 rounded" :class="light ? 'bg-white' : 'bg-[#2C3E50]'" />
  </div>
</template>
