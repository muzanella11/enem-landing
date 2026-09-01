<script lang="ts" setup>
import type { Project } from '@enem-landing/shared-types';
import SectionDivider from './SectionDivider.vue';

defineProps<{ project: Project | null }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div
    v-if="project"
    class="fixed inset-0 z-50 bg-black/60 flex items-start md:items-center justify-center p-4 overflow-y-auto"
    @click.self="emit('close')"
  >
    <div class="bg-white rounded-lg max-w-2xl w-full p-6 relative">
      <button
        class="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-2xl leading-none"
        aria-label="Close"
        @click="emit('close')"
      >
        &times;
      </button>

      <h2 class="text-2xl font-bold uppercase text-center text-[#2C3E50] mb-2">
        {{ project.title }}
      </h2>
      <SectionDivider />

      <img
        v-if="project.image[0]"
        :src="project.image[0]"
        alt=""
        class="w-full h-64 object-contain rounded mb-4 bg-slate-50"
      />

      <p class="mb-2">
        <span class="font-semibold">Year:</span> {{ project.year }}
      </p>

      <p class="mb-2">
        <template v-if="project.url">
          <span class="font-semibold">Link:</span>
          <a
            :href="project.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#1ABC9C] hover:underline ml-1"
          >
            {{ project.url }}
          </a>
        </template>
        <template v-else> Internal app, no preview link available </template>
      </p>

      <p class="mb-4">
        <span class="font-semibold">Technologies:</span>
        <span
          v-for="tech in project.technologies"
          :key="tech"
          class="inline-block px-2 py-0.5 mr-1 mt-1 rounded-full bg-[#1ABC9C]/10 text-[#1ABC9C] text-xs"
        >
          {{ tech }}
        </span>
      </p>

      <p class="text-slate-700">{{ project.description }}</p>
    </div>
  </div>
</template>
