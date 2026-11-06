<script setup lang="ts">
export interface FaqItem {
  q: string;
  a: string;
}

const props = withDefaults(
  defineProps<{
    slug: string;
    title: string;
    description: string;
    /** Shorter <title>; defaults to `title`. */
    seoTitle?: string;
    applicationCategory?: string;
    faqs?: FaqItem[];
    sources?: readonly { label: string; url: string }[];
    checkedAt?: string;
    caveats?: readonly string[];
    /** "Cara hitung" etc. need room: hides the sidebar ad on long tools. */
    wide?: boolean;
  }>(),
  {
    seoTitle: undefined,
    applicationCategory: 'FinanceApplication',
    faqs: () => [],
    sources: () => [],
    checkedAt: undefined,
    caveats: () => [],
    wide: false,
  },
);

const siteUrl = useRuntimeConfig().public.siteUrl as string;
const { isToolEnabled } = useToolsConfig();
const enabled = computed(() => isToolEnabled(props.slug));
const canonicalUrl = `${siteUrl}/${props.slug}`;
const pageTitle = props.seoTitle ?? props.title;

useSeoMeta({
  title: pageTitle,
  description: props.description,
  ogTitle: pageTitle,
  ogDescription: props.description,
  ogUrl: canonicalUrl,
  ogType: 'website',
  ogImage: `${siteUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  robots: () => (enabled.value ? 'index, follow' : 'noindex, follow'),
});

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: props.title,
    url: canonicalUrl,
    description: props.description,
    applicationCategory: props.applicationCategory,
    operatingSystem: 'Any',
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tools', item: `${siteUrl}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: props.title,
        item: canonicalUrl,
      },
    ],
  },
  ...(props.faqs.length > 0
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: props.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        },
      ]
    : []),
];

useHead({
  link: [{ rel: 'canonical', href: canonicalUrl }],
  script: jsonLd.map((data) => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(data),
  })),
});

const events = useToolEvents(props.slug);
onMounted(() => {
  if (enabled.value) events.view();
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-6 sm:py-10">
    <nav class="mb-3 text-sm text-slate-500" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-teal-700">Tools</NuxtLink>
      <span aria-hidden="true"> / </span>
      <span class="text-slate-700">{{ title }}</span>
    </nav>

    <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
      {{ title }}
    </h1>
    <p class="mt-2 max-w-3xl text-slate-600">{{ description }}</p>

    <div v-if="!enabled" class="card mt-6">
      <p class="font-semibold">Tool ini sedang dinonaktifkan.</p>
      <p class="mt-1 text-slate-600">
        Silakan coba lagi nanti, atau pakai tool lain di
        <NuxtLink to="/" class="btn-link">halaman utama</NuxtLink>.
      </p>
    </div>

    <template v-else>
      <p
        class="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
      >
        <span aria-hidden="true">🔒</span>
        Dihitung di perangkatmu. Tidak ada data yang dikirim ke server.
      </p>

      <div
        class="mt-6 grid gap-6"
        :class="wide ? '' : 'lg:grid-cols-[minmax(0,1fr)_300px]'"
      >
        <div class="min-w-0 space-y-6">
          <slot />
        </div>
        <aside v-if="!wide" class="hidden lg:block">
          <div class="sticky top-6">
            <AdSlot placement="sidebar" :slug="slug" />
          </div>
        </aside>
      </div>

      <section v-if="faqs.length > 0" class="mt-10 max-w-3xl">
        <h2 class="text-xl font-bold">Tanya jawab</h2>
        <div
          class="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white"
        >
          <details v-for="faq in faqs" :key="faq.q" class="group p-4">
            <summary class="cursor-pointer list-none font-medium">
              {{ faq.q }}
            </summary>
            <p class="mt-2 text-sm text-slate-600">{{ faq.a }}</p>
          </details>
        </div>
      </section>

      <section
        v-if="sources.length > 0 || caveats.length > 0"
        class="mt-8 max-w-3xl text-sm text-slate-600"
      >
        <h2 class="font-semibold text-slate-800">Sumber dan catatan</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li v-for="source in sources" :key="source.label">
            <a
              :href="source.url"
              class="btn-link"
              rel="noopener"
              target="_blank"
              >{{ source.label }}</a
            >
          </li>
          <li v-for="caveat in caveats" :key="caveat">{{ caveat }}</li>
        </ul>
        <p v-if="checkedAt" class="mt-2">
          Aturan terakhir dicek:
          {{
            new Date(checkedAt).toLocaleDateString('id-ID', {
              dateStyle: 'long',
            })
          }}.
        </p>
      </section>
    </template>
  </div>
</template>
