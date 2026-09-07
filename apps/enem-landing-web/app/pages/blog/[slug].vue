<script lang="ts" setup>
import { computed } from 'vue';
import type { BlogPost } from '@enem-landing/shared-types';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import sanitizeHtml from 'sanitize-html';
import BlogPostCard from '../../components/BlogPostCard.vue';

definePageMeta({ layout: 'blog' });

const route = useRoute();
const slug = route.params['slug'] as string;
const SITE_URL = 'https://muzanella.com';

// `useFetch` doesn't throw on a non-2xx response - it just leaves `data`
// null (same pattern as `pages/index.vue`'s seo-meta fetch), so a
// draft/missing slug (the BFF route 404s) falls straight through to this
// explicit check instead of hitting Nuxt's generic error boundary.
const { data: post } = await useFetch<BlogPost>(`/api/blog-posts/${slug}`);
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post not found' });
}

const { data: related } = await useFetch<BlogPost[]>(
  `/api/blog-posts/${slug}/related`,
);

const contentHtml = computed(() => {
  const ops = (post.value?.contentDelta as { ops?: unknown[] })?.ops ?? [];
  const converter = new QuillDeltaToHtmlConverter(ops as never[], {});
  return sanitizeHtml(converter.convert(), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height'],
      a: ['href', 'name', 'target', 'rel'],
    },
  });
});

const seoTitle = computed(
  () => post.value?.metaTitle || post.value?.title || '',
);
const seoDescription = computed(
  () => post.value?.metaDescription || post.value?.excerpt || '',
);
const seoImage = computed(
  () => post.value?.ogImageUrl || post.value?.coverImageUrl || undefined,
);
const canonicalUrl = computed(() => `${SITE_URL}/blog/${slug}`);

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: seoImage,
  ogUrl: canonicalUrl,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: seoTitle,
  twitterDescription: seoDescription,
  twitterImage: seoImage,
});

const articleJsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.value?.title,
    description: seoDescription.value,
    datePublished: post.value?.publishedAt,
    dateModified: post.value?.updatedAt,
    ...(post.value?.coverImageUrl ? { image: post.value.coverImageUrl } : {}),
    author: { '@type': 'Person', name: 'Nurfirliana Muzanella' },
  }),
);

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{ type: 'application/ld+json', innerHTML: articleJsonLd.value }],
});

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
</script>

<template>
  <article v-if="post" class="px-4 pb-24">
    <header class="max-w-3xl mx-auto text-center py-12">
      <div
        v-if="post.categories.length"
        class="flex flex-wrap gap-2 justify-center mb-4 text-xs uppercase tracking-wide text-[#0E7C6B] font-bold"
      >
        <NuxtLink
          v-for="category in post.categories"
          :key="category.id"
          :to="`/blog/category/${category.slug}`"
          class="hover:underline"
          >{{ category.name }}</NuxtLink
        >
      </div>
      <h1 class="text-3xl lg:text-5xl font-bold text-[#2C3E50]">
        {{ post.title }}
      </h1>
      <p class="text-sm text-black/40 mt-4">
        {{ formatDate(post.publishedAt) }}
      </p>
    </header>

    <img
      v-if="post.coverImageUrl"
      :src="post.coverImageUrl"
      :alt="post.title"
      class="max-w-3xl w-full mx-auto rounded-lg mb-12 object-cover max-h-[28rem]"
    />

    <div
      class="c-post-content max-w-3xl mx-auto text-lg leading-relaxed"
      v-html="contentHtml"
    />

    <div
      v-if="post.tags.length"
      class="max-w-3xl mx-auto flex flex-wrap gap-2 mt-12"
    >
      <NuxtLink
        v-for="tag in post.tags"
        :key="tag.id"
        :to="`/blog/tag/${tag.slug}`"
        class="px-3 py-1 rounded-full text-xs bg-[#2C3E50]/5 text-[#2C3E50] hover:bg-[#0E7C6B] hover:text-white transition-colors"
        >#{{ tag.name }}</NuxtLink
      >
    </div>

    <section v-if="related?.length" class="max-w-5xl mx-auto mt-20">
      <h2 class="text-2xl font-bold uppercase text-center text-[#2C3E50] mb-8">
        Related Posts
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <BlogPostCard
          v-for="relatedPost in related"
          :key="relatedPost.id"
          :post="relatedPost"
        />
      </div>
    </section>
  </article>
</template>

<style scoped>
/* No Tailwind Typography plugin in this app (not installed) - Tailwind's
   preflight strips default margins/list-style from the raw HTML `quill-
   delta-to-html` produces, so the rendered article needs its own explicit
   spacing here instead. */
.c-post-content :deep(h1),
.c-post-content :deep(h2),
.c-post-content :deep(h3) {
  color: #2c3e50;
  font-weight: 700;
  margin: 1.5em 0 0.6em;
}

.c-post-content :deep(p) {
  margin: 0 0 1.2em;
}

.c-post-content :deep(ul),
.c-post-content :deep(ol) {
  margin: 0 0 1.2em;
  padding-left: 1.5em;
}

.c-post-content :deep(li) {
  margin-bottom: 0.4em;
}

.c-post-content :deep(blockquote) {
  border-left: 3px solid #0e7c6b;
  padding-left: 1em;
  margin: 0 0 1.2em;
  color: rgba(0, 0, 0, 0.6);
}

.c-post-content :deep(a) {
  color: #0e7c6b;
  text-decoration: underline;
}

.c-post-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 1.2em 0;
}
</style>
