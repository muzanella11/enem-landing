<script lang="ts" setup>
import type { BlogPost } from '@enem-landing/shared-types';

// `priority`: cards in the first row, visible without scrolling. Their
// covers load eagerly (one of them is usually the page's LCP element);
// the rest stay lazy.
// `headingLevel`: 2 on listing pages (right under the page's h1), 3 under
// an h2 like "Related Posts" - skipping a level fails PageSpeed's
// accessibility heading-order audit.
withDefaults(
  defineProps<{ post: BlogPost; priority?: boolean; headingLevel?: 2 | 3 }>(),
  { priority: false, headingLevel: 2 },
);

const IMAGE_NOT_AVAILABLE = '/img/image-not-available.svg';

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
</script>

<template>
  <NuxtLink
    :to="`/blog/${post.slug}`"
    class="block rounded-lg overflow-hidden group border border-black/5 hover:shadow-lg transition-shadow"
  >
    <img
      :src="post.coverImageUrl || IMAGE_NOT_AVAILABLE"
      :alt="post.title"
      width="1200"
      height="630"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="w-full h-48 object-cover"
    />
    <div class="p-5">
      <div
        v-if="post.categories.length"
        class="flex flex-wrap gap-2 mb-2 text-xs uppercase tracking-wide text-[#0E7C6B] font-bold"
      >
        <span v-for="category in post.categories" :key="category.id">{{
          category.name
        }}</span>
      </div>
      <component
        :is="`h${headingLevel}`"
        class="font-semibold text-lg group-hover:text-[#0E7C6B] transition-colors"
      >
        {{ post.title }}
      </component>
      <p v-if="post.excerpt" class="text-sm text-black/60 mt-2 line-clamp-3">
        {{ post.excerpt }}
      </p>
      <p class="text-xs text-black/60 mt-3">
        {{ formatDate(post.publishedAt) }}
      </p>
    </div>
  </NuxtLink>
</template>
