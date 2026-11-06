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
    /** Page path when it isn't `/${slug}` (e.g. a per-province page). */
    path?: string;
    /** OG image key under /og when it isn't the slug. */
    ogKey?: string;
    /** Extra breadcrumb between "Tools" and the title. */
    parent?: { name: string; path: string };
    /** "Cara pakai" steps - rendered server-side so search engines see them. */
    howTo?: string[];
    sources?: readonly { label: string; url: string }[];
    checkedAt?: string;
    caveats?: readonly string[];
    /** Health tools (Story 34): adds MedicalWebPage JSON-LD. */
    medical?: boolean;
    /** "Cara hitung" etc. need room: hides the sidebar ad on long tools. */
    wide?: boolean;
  }>(),
  {
    seoTitle: undefined,
    applicationCategory: 'FinanceApplication',
    faqs: () => [],
    howTo: () => [],
    path: undefined,
    ogKey: undefined,
    parent: undefined,
    sources: () => [],
    checkedAt: undefined,
    caveats: () => [],
    medical: false,
    wide: false,
  },
);

const { config, findTool, isToolEnabled } = useToolsConfig();
const enabled = computed(() => isToolEnabled(props.slug));
const embed = useEmbed();
const pageTitle = props.seoTitle ?? props.title;

const { siteUrl, url: canonicalUrl } = usePageSeo({
  title: pageTitle,
  description: props.description,
  path: props.path ?? `/${props.slug}`,
  ogKey: props.ogKey ?? props.slug,
  robots: () =>
    enabled.value && !embed.value
      ? 'index, follow, max-image-preview:large, max-snippet:-1'
      : 'noindex, follow',
});

/** Internal links: same category first, then the rest, up to 6. */
const relatedTools = computed(() => {
  const category = findTool(props.slug)?.category;
  const others = config.value.tools.filter((tool) => tool.slug !== props.slug);
  return [
    ...others.filter((tool) => tool.category === category),
    ...others.filter((tool) => tool.category !== category),
  ].slice(0, 6);
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
      ...(props.parent
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: props.parent.name,
              item: `${siteUrl}${props.parent.path}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: props.parent ? 3 : 2,
        name: props.title,
        item: canonicalUrl,
      },
    ],
  },
  ...(props.medical
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'MedicalWebPage',
          name: props.title,
          url: canonicalUrl,
          description: props.description,
          inLanguage: 'id-ID',
          audience: { '@type': 'PeopleAudience', audienceType: 'Patient' },
          ...(props.checkedAt ? { lastReviewed: props.checkedAt } : {}),
          citation: props.sources.map((source) => source.url),
        },
      ]
    : []),
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
  <div v-if="embed" class="space-y-4 p-3">
    <h1 class="text-lg font-bold text-slate-900">{{ title }}</h1>
    <p v-if="!enabled" class="text-sm text-slate-600">
      Tool ini sedang dinonaktifkan.
    </p>
    <div v-else class="space-y-4"><slot /></div>
    <p class="text-xs text-slate-500">
      Dibuat oleh
      <a
        :href="`${siteUrl}${path ?? `/${slug}`}`"
        target="_blank"
        rel="noopener"
        class="btn-link"
        >tools.muzanella.com</a
      >. Dihitung di perangkatmu, tidak ada data yang dikirim.
    </p>
  </div>
  <div v-else class="mx-auto max-w-6xl px-4 py-6 sm:py-10">
    <nav class="mb-3 text-sm text-slate-500" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-teal-700">Tools</NuxtLink>
      <span aria-hidden="true"> / </span>
      <template v-if="parent">
        <NuxtLink :to="parent.path" class="hover:text-teal-700">{{
          parent.name
        }}</NuxtLink>
        <span aria-hidden="true"> / </span>
      </template>
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

      <section v-if="howTo.length > 0" class="mt-10 max-w-3xl">
        <h2 class="text-xl font-bold">Cara pakai {{ title }}</h2>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
          <li v-for="step in howTo" :key="step">{{ step }}</li>
        </ol>
      </section>

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

      <nav
        v-if="relatedTools.length > 0"
        class="mt-10"
        aria-label="Tools lainnya"
      >
        <h2 class="text-xl font-bold">Tools lainnya</h2>
        <ul class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="tool in relatedTools" :key="tool.slug">
            <NuxtLink
              :to="`/${tool.slug}`"
              class="card block h-full transition hover:border-teal-600"
            >
              <span class="font-semibold text-slate-900">{{ tool.name }}</span>
              <span class="mt-1 block text-sm text-slate-600">{{
                tool.shortDescription
              }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </template>
  </div>
</template>
