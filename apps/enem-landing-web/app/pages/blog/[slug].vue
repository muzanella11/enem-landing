<script lang="ts" setup>
import { computed } from 'vue';
import type { BlogPost } from '@enem-landing/shared-types';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import sanitizeHtml from 'sanitize-html';
import { trackGaEvent } from '@enem-landing/frontend/tracking';
import ArticleAd from '../../components/ArticleAd.vue';
import BlogPostCard from '../../components/BlogPostCard.vue';
import BuyMeCoffee from '../../components/BuyMeCoffee.vue';
import ShareBar from '../../components/ShareBar.vue';
import { splitArticleHtml } from '../../utils/split-article-html';

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

// Story 56: ads are on only when the CMS switches say so (`articleSlot`
// is null otherwise). Short articles get just the ad at the end.
const { data: adsense } = await useAdsenseAccount();
const adClientId = computed(() => adsense.value?.clientId ?? '');
const adSlotId = computed(() => adsense.value?.articleSlot ?? '');
const showAds = computed(() => Boolean(adClientId.value && adSlotId.value));
const contentParts = computed<[string, string | null]>(() => {
  if (!showAds.value) return [contentHtml.value, null];
  return splitArticleHtml(contentHtml.value) ?? [contentHtml.value, null];
});

// Story 56: which articles send readers on to the tools hub (GA4 only;
// the in-house tracker already records the click itself).
const { toolsHost } = useRuntimeConfig().public;
const toolsHostname = (() => {
  try {
    return new URL(String(toolsHost)).hostname;
  } catch {
    return '';
  }
})();
const onContentClick = (event: MouseEvent) => {
  const link = (event.target as HTMLElement | null)?.closest?.('a');
  if (!link || !toolsHostname) return;
  let url: URL;
  try {
    url = new URL(link.href);
  } catch {
    return;
  }
  if (url.hostname !== toolsHostname) return;
  const toolId = url.pathname.split('/').filter(Boolean)[0] ?? 'hub';
  trackGaEvent('blog_to_tools', { tool_id: toolId, post_slug: slug });
};

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
      <ShareBar
        :url="canonicalUrl"
        :title="post.title"
        placement="article-top"
        class="justify-center mt-6"
      />
    </header>

    <img
      v-if="post.coverImageUrl"
      :src="post.coverImageUrl"
      :alt="post.title"
      class="max-w-3xl w-full mx-auto rounded-lg mb-12 object-cover max-h-[28rem]"
    />

    <div
      class="c-post-content max-w-3xl mx-auto text-lg leading-relaxed"
      @click="onContentClick"
      v-html="contentParts[0]"
    />
    <template v-if="contentParts[1] !== null">
      <ArticleAd
        :client-id="adClientId"
        :slot-id="adSlotId"
        placement="in-article"
      />
      <div
        class="c-post-content max-w-3xl mx-auto text-lg leading-relaxed"
        @click="onContentClick"
        v-html="contentParts[1]"
      />
    </template>

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

    <div class="max-w-3xl mx-auto mt-10 pt-6 border-t border-black/5">
      <p class="font-semibold text-[#2C3E50] mb-3">
        Found this useful? Share it with someone who needs it.
      </p>
      <ShareBar
        :url="canonicalUrl"
        :title="post.title"
        placement="article-bottom"
      />
      <BuyMeCoffee :post-slug="slug" class="mt-8" />
    </div>

    <ArticleAd
      v-if="showAds"
      :client-id="adClientId"
      :slot-id="adSlotId"
      placement="end"
    />

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
