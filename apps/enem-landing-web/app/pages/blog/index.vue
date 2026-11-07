<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type {
  BlogTaxonomyWithCount,
  PaginatedBlogPosts,
} from '@enem-landing/shared-types';
import BlogFilterModal from '../../components/BlogFilterModal.vue';
import BlogPostCard from '../../components/BlogPostCard.vue';

definePageMeta({ layout: 'blog' });

const route = useRoute();
const router = useRouter();

const queryString = (key: string) => {
  const value = route.query[key];
  return typeof value === 'string' && value ? value : null;
};
const page = computed(() => Number(route.query['page']) || 1);
const q = computed(() => queryString('q'));
const category = computed(() => queryString('category'));
const tag = computed(() => queryString('tag'));

const { data: paginated } = await useFetch<PaginatedBlogPosts>(
  '/api/blog-posts',
  {
    query: { page, q, category, tag },
    watch: [page, q, category, tag],
  },
);
// Only categories/tags used by a published post, so a filter never leads to
// an empty list.
const { data: categories } = await useFetch<BlogTaxonomyWithCount[]>(
  '/api/blog-categories',
  { query: { published: 'true' } },
);
const { data: tags } = await useFetch<BlogTaxonomyWithCount[]>(
  '/api/blog-tags',
  { query: { published: 'true' } },
);

const totalPages = computed(() =>
  paginated.value
    ? Math.max(1, Math.ceil(paginated.value.total / paginated.value.pageSize))
    : 1,
);

/** Builds a query with `patch` applied; any filter change goes back to page 1. */
const withQuery = (patch: Record<string, string | null>) => {
  const next: Record<string, string> = {};
  const merged = {
    q: q.value,
    category: category.value,
    tag: tag.value,
    ...patch,
  };
  for (const [key, value] of Object.entries(merged)) {
    if (value) next[key] = value;
  }
  return next;
};
const pageQuery = (target: number) => ({
  ...withQuery({}),
  ...(target > 1 ? { page: String(target) } : {}),
});

// Search box: typed text is pushed to the URL after a short pause.
const search = ref(q.value ?? '');
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const submitSearch = () => {
  clearTimeout(searchTimer);
  const value = search.value.trim();
  if (value === (q.value ?? '')) return;
  router.replace({ query: withQuery({ q: value || null }) });
};
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(submitSearch, 400);
});
watch(q, (value) => {
  if ((value ?? '') !== search.value.trim()) search.value = value ?? '';
});
onBeforeUnmount(() => clearTimeout(searchTimer));

const filterOpen = ref(false);
const activeFilterCount = computed(
  () => (category.value ? 1 : 0) + (tag.value ? 1 : 0),
);
const categoryName = computed(
  () =>
    categories.value?.find((item) => item.slug === category.value)?.name ??
    category.value,
);
const tagName = computed(
  () => tags.value?.find((item) => item.slug === tag.value)?.name ?? tag.value,
);
const applyFilter = (value: { category: string | null; tag: string | null }) => {
  filterOpen.value = false;
  router.push({ query: withQuery(value) });
};
const clearAll = () => {
  search.value = '';
  router.push({ query: {} });
};

const hasCriteria = computed(() => !!(q.value || category.value || tag.value));

useSeoMeta({
  title: 'Blog - Nurfirliana Muzanella',
  description: 'Articles on frontend engineering, Vue.js, and web development.',
});
// Search/filter result pages are thin duplicates of the main list.
useHead(() => ({
  meta: hasCriteria.value ? [{ name: 'robots', content: 'noindex, follow' }] : [],
}));
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

    <section class="px-4 mb-8">
      <div class="max-w-5xl mx-auto">
        <form
          role="search"
          class="flex gap-2 max-w-2xl mx-auto"
          @submit.prevent="submitSearch"
        >
          <input
            v-model="search"
            type="search"
            placeholder="Search articles"
            aria-label="Search articles"
            class="flex-1 min-w-0 px-4 py-2 rounded border border-black/10 text-sm focus:outline-none focus:border-[#0E7C6B]"
          />
          <button
            type="button"
            class="relative px-4 py-2 rounded bg-[#2C3E50]/5 text-[#2C3E50] text-sm font-bold hover:bg-[#0E7C6B] hover:text-white transition-colors"
            :aria-label="`Filter${activeFilterCount ? `, ${activeFilterCount} active` : ''}`"
            @click="filterOpen = true"
          >
            Filter
            <span
              v-if="activeFilterCount"
              class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0E7C6B] text-white text-xs"
              >{{ activeFilterCount }}</span
            >
          </button>
        </form>

        <div
          v-if="hasCriteria"
          class="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs"
        >
          <span class="text-black/50">
            {{ paginated?.total ?? 0 }}
            {{ paginated?.total === 1 ? 'post' : 'posts' }}
          </span>
          <NuxtLink
            v-if="q"
            :to="{ query: withQuery({ q: null }) }"
            class="px-3 py-1 rounded-full bg-[#2C3E50]/5 text-[#2C3E50] hover:bg-[#2C3E50]/10"
            :aria-label="`Remove search ${q}`"
            >"{{ q }}" &times;</NuxtLink
          >
          <NuxtLink
            v-if="category"
            :to="{ query: withQuery({ category: null }) }"
            class="px-3 py-1 rounded-full bg-[#2C3E50]/5 text-[#2C3E50] font-bold uppercase hover:bg-[#2C3E50]/10"
            :aria-label="`Remove category ${categoryName}`"
            >{{ categoryName }} &times;</NuxtLink
          >
          <NuxtLink
            v-if="tag"
            :to="{ query: withQuery({ tag: null }) }"
            class="px-3 py-1 rounded-full bg-[#2C3E50]/5 text-[#2C3E50] hover:bg-[#2C3E50]/10"
            :aria-label="`Remove tag ${tagName}`"
            >#{{ tagName }} &times;</NuxtLink
          >
          <button
            type="button"
            class="text-[#0E7C6B] hover:underline"
            @click="clearAll"
          >
            Clear all
          </button>
        </div>
      </div>
    </section>

    <BlogFilterModal
      :open="filterOpen"
      :categories="categories ?? []"
      :tags="tags ?? []"
      :category="category"
      :tag="tag"
      @close="filterOpen = false"
      @apply="applyFilter"
    />

    <section class="px-4 pb-24">
      <div class="max-w-5xl mx-auto">
        <p
          v-if="paginated && paginated.items.length === 0"
          class="text-center text-black/50"
        >
          {{ hasCriteria ? 'No posts match your search.' : 'No posts yet.' }}
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
            :to="{ query: pageQuery(page - 1) }"
            class="px-4 py-2 rounded bg-[#2C3E50]/5 hover:bg-[#0E7C6B] hover:text-white transition-colors text-sm font-bold"
            >Previous</NuxtLink
          >
          <span class="text-sm text-black/50"
            >Page {{ page }} of {{ totalPages }}</span
          >
          <NuxtLink
            v-if="page < totalPages"
            :to="{ query: pageQuery(page + 1) }"
            class="px-4 py-2 rounded bg-[#2C3E50]/5 hover:bg-[#0E7C6B] hover:text-white transition-colors text-sm font-bold"
            >Next</NuxtLink
          >
        </div>
      </div>
    </section>
  </div>
</template>
