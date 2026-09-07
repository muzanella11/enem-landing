<script lang="ts" setup>
import { computed } from 'vue';
import type {
  BlogCategory,
  BlogTag,
  PaginatedBlogPosts,
} from '@enem-landing/shared-types';
import BlogPostCard from '../../components/BlogPostCard.vue';

definePageMeta({ layout: 'blog' });

const route = useRoute();
const page = computed(() => Number(route.query['page']) || 1);

const { data: paginated } = await useFetch<PaginatedBlogPosts>(
  '/api/blog-posts',
  { query: { page }, watch: [page] },
);
const { data: categories } = await useFetch<BlogCategory[]>(
  '/api/blog-categories',
);
const { data: tags } = await useFetch<BlogTag[]>('/api/blog-tags');

const totalPages = computed(() =>
  paginated.value
    ? Math.max(1, Math.ceil(paginated.value.total / paginated.value.pageSize))
    : 1,
);

useSeoMeta({
  title: 'Blog - Nurfirliana Muzanella',
  description: 'Articles on frontend engineering, Vue.js, and web development.',
});
</script>

<template>
  <div>
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto text-center">
        <h1 class="text-3xl lg:text-5xl font-bold uppercase text-[#2C3E50]">
          Blog
        </h1>
        <SectionDivider />
      </div>
    </section>

    <section v-if="categories?.length || tags?.length" class="px-4 mb-8">
      <div class="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
        <NuxtLink
          v-for="category in categories ?? []"
          :key="category.id"
          :to="`/blog/category/${category.slug}`"
          class="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#2C3E50]/5 text-[#2C3E50] hover:bg-[#0E7C6B] hover:text-white transition-colors"
          >{{ category.name }}</NuxtLink
        >
        <NuxtLink
          v-for="tag in tags ?? []"
          :key="tag.id"
          :to="`/blog/tag/${tag.slug}`"
          class="px-3 py-1 rounded-full text-xs bg-[#2C3E50]/5 text-[#2C3E50] hover:bg-[#0E7C6B] hover:text-white transition-colors"
          >#{{ tag.name }}</NuxtLink
        >
      </div>
    </section>

    <section class="px-4 pb-24">
      <div class="max-w-5xl mx-auto">
        <p
          v-if="paginated && paginated.items.length === 0"
          class="text-center text-black/50"
        >
          No posts yet.
        </p>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BlogPostCard
            v-for="post in paginated?.items ?? []"
            :key="post.id"
            :post="post"
          />
        </div>

        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-4 mt-12"
        >
          <NuxtLink
            v-if="page > 1"
            :to="{ query: { page: page - 1 } }"
            class="px-4 py-2 rounded bg-[#2C3E50]/5 hover:bg-[#0E7C6B] hover:text-white transition-colors text-sm font-bold"
            >Previous</NuxtLink
          >
          <span class="text-sm text-black/50">Page {{ page }} of {{ totalPages }}</span>
          <NuxtLink
            v-if="page < totalPages"
            :to="{ query: { page: page + 1 } }"
            class="px-4 py-2 rounded bg-[#2C3E50]/5 hover:bg-[#0E7C6B] hover:text-white transition-colors text-sm font-bold"
            >Next</NuxtLink
          >
        </div>
      </div>
    </section>
  </div>
</template>
