<script lang="ts" setup>
import type { SocialLink } from '@enem-landing/shared-types';

defineProps<{ socialLinks: SocialLink[] }>();
</script>

<template>
  <footer class="bg-[#2C3E50] text-white text-center py-20 px-4">
    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
      <div>
        <h3 class="uppercase font-bold mb-4">Location</h3>
        <p class="text-lg font-light">
          Griya Bukit Jaya. Blok M 11/27
          <br />
          Gunung Putri, Bogor
        </p>
      </div>

      <div>
        <h3 class="uppercase font-bold mb-4">Around the Web</h3>
        <div class="flex justify-center gap-3">
          <a
            v-for="link in socialLinks"
            :key="link.platform"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="w-12 h-12 rounded-full border border-white flex items-center justify-center text-xs uppercase hover:bg-[#0E7C6B] hover:border-[#0E7C6B] transition-colors"
          >
            {{ link.platform.slice(0, 2) }}
          </a>
        </div>
      </div>

      <div>
        <h3 class="uppercase font-bold mb-4">About This Page</h3>
        <p class="text-lg font-light">
          "Create with love, passion and some caffeine. Touch me and call me if
          you're interested with my profile."
        </p>
      </div>
    </div>
  </footer>
</template>
