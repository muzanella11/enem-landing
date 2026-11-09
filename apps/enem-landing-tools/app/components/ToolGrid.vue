<script setup lang="ts">
import type { ToolsPublicConfig } from '@enem-landing/shared-types';

/**
 * The hub's tool cards. Plain links with no client-side behaviour, so the
 * hub renders this with `hydrate-never`: hydrating ~100 NuxtLinks (and the
 * route prefetching each visible one triggers) was most of the hub's Total
 * Blocking Time on PageSpeed mobile. The server HTML stays as is and the
 * links work as normal page loads.
 */
defineProps<{
  groups: {
    category: string;
    label: string;
    tools: ToolsPublicConfig['tools'];
  }[];
}>();
</script>

<template>
  <div>
    <section v-for="group in groups" :key="group.category" class="mt-10">
      <h2 class="text-lg font-semibold text-slate-800">{{ group.label }}</h2>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="tool in group.tools" :key="tool.slug">
          <NuxtLink
            :to="`/${tool.slug}`"
            class="card flex h-full flex-col transition hover:border-primary hover:shadow-md"
          >
            <span class="flex items-center gap-2">
              <span class="font-semibold text-slate-900">{{ tool.name }}</span>
              <span
                v-if="tool.badge"
                class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary"
                >{{ tool.badge }}</span
              >
            </span>
            <span class="mt-2 text-sm text-slate-600">{{
              tool.shortDescription
            }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
