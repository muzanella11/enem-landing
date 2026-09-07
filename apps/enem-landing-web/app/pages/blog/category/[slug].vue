<script lang="ts" setup>
import { computed } from 'vue';
import type {
  BlogCategory,
  PaginatedBlogPosts,
} from '@enem-landing/shared-types';
import BlogPostCard from '../../../components/BlogPostCard.vue';

definePageMeta({ layout: 'blog' });

const route = useRoute();
const slug = route.params['slug'] as string;
const page = computed(() => Number(route.query['page']) || 1);

const [{ data: paginated }, { data: categories }] = await Promise.all([
  useFetch<PaginatedBlogPosts>('/api/blog-posts', {
    query: { category: slug, page },
    watch: [page],
  }),
  useFetch<BlogCategory[]>('/api/blog-categories'),
]);

const category = computed(() =>
  categories.value?.find((item) => item.slug === slug),
);
if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' });
}

const totalPages = computed(() =>
  paginated.value
    ? Math.max(1, Math.ceil(paginated.value.total / paginated.value.pageSize))
    : 1,
);

useSeoMeta({
  title: computed(() => `${category.value?.name} - Blog`),
  description: computed(
    () => `Posts in ${category.value?.name} on Nurfirliana Muzanella's blog.`,
  ),
});
</script>

<template>
  <div>
    <section class="py-16 px-4">
      <div class="max-w-5xl mx-auto text-center">
        <p class="text-xs uppercase tracking-wide text-[#0E7C6B] font-bold">
          Category
        </p>
        <h1 class="text-3xl lg:text-5xl font-bold uppercase text-[#2C3E50]">
          {{ category?.name }}
        </h1>
        <SectionDivider />
        <NuxtLink to="/blog" class="text-sm text-[#0E7C6B] hover:underline"
          >&larr; All posts</NuxtLink
        >
      </div>
    </section>

    <section class="px-4 pb-24">
      <div class="max-w-5xl mx-auto">
        <p
          v-if="paginated && paginated.items.length === 0"
          class="text-center text-black/50"
        >
          No posts in this category yet.
        </p>
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
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
          <span class="text-sm text-black/50"
            >Page {{ page }} of {{ totalPages }}</span
          >
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
