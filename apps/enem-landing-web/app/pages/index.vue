<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import type {
  Experience,
  Project,
  SeoMeta,
  SiteProfile,
} from '@enem-landing/shared-types';
import PortfolioModal from '../components/PortfolioModal.vue';
import SectionDivider from '../components/SectionDivider.vue';

const IMAGE_NOT_AVAILABLE = '/img/image-not-available.svg';

// `project.image[0] || IMAGE_NOT_AVAILABLE` only covers a missing URL - a
// broken/404ing one (deleted upload, bad CMS entry) would otherwise render
// as a broken-image icon. The `src` check guards against looping if
// IMAGE_NOT_AVAILABLE itself ever failed to load.
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  if (img.src !== new URL(IMAGE_NOT_AVAILABLE, window.location.href).href) {
    img.src = IMAGE_NOT_AVAILABLE;
  }
};

// SEO meta is optional content (managed via enem-landing-cms) - fall back
// to sensible defaults rather than a hard failure when nothing's been set
// for this page yet.
const DEFAULT_SEO = {
  title: 'Nurfirliana Muzanella',
  description:
    "Hello, I'm Frontend Engineer. Combine the art of design with the art of programming.",
};
// These 3 calls used to be awaited one after another, making SSR wait for
// their latencies back-to-back (measured ~2.9s combined TTFB on prod: 1.35s
// + 1.39s + 0.17s) instead of in parallel (~1.4s, the slowest one) -
// `useFetch` doesn't throw on a non-2xx response either way, it just
// leaves `data` null, so no seo-meta row yet for "home" falls straight
// through to the defaults below regardless of fetch order.
const [{ data: experiences }, { data: siteProfile }, { data: seoResponse }] =
  await Promise.all([
    useFetch<Experience[]>('/api/experiences'),
    useFetch<SiteProfile>('/api/site-profile'),
    useFetch<SeoMeta>('/api/seo-meta/home'),
  ]);
const seoTitle = computed(() => seoResponse.value?.title ?? DEFAULT_SEO.title);
const seoDescription = computed(
  () => seoResponse.value?.description ?? DEFAULT_SEO.description,
);
useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogImage: seoResponse.value?.ogImageUrl || undefined,
});
// `siteProfile`/`seoResponse` are already resolved by the top-level
// `await useFetch(...)` calls above, so this doesn't need to be reactive -
// computed once per SSR render, same as the page's other derived values.
const personJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: siteProfile.value?.heroTitle || DEFAULT_SEO.title,
  jobTitle: siteProfile.value?.heroSubtitle || 'Frontend Engineer',
  description: seoDescription.value,
  url: 'https://muzanella.com/',
  ...(siteProfile.value?.avatarUrl
    ? { image: siteProfile.value.avatarUrl }
    : {}),
  ...(siteProfile.value?.socialLinks?.length
    ? { sameAs: siteProfile.value.socialLinks.map((link) => link.url) }
    : {}),
});
useHead({
  link: [{ rel: 'canonical', href: 'https://muzanella.com/' }],
  script: [{ type: 'application/ld+json', innerHTML: personJsonLd }],
});

const portfolioEntries = computed<Project[]>(
  () => experiences.value?.flatMap((experience) => experience.projects) ?? [],
);

const activePortfolio = ref<Project | null>(null);
const openPortfolio = (project: Project) => {
  activePortfolio.value = project;
};

const businessCardShown = ref(false);
const toggleBusinessCard = () => {
  businessCardShown.value = !businessCardShown.value;
};

const entryContact = reactive({
  fullname: '',
  email: '',
  phoneNumber: '',
  message: '',
});
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const isError = ref(false);

const submitContact = async () => {
  isSubmitting.value = true;
  isError.value = false;
  isSubmitted.value = false;
  try {
    await $fetch('/api/contact-submissions', {
      method: 'post',
      body: entryContact,
    });
    isSubmitted.value = true;
    entryContact.fullname = '';
    entryContact.email = '';
    entryContact.phoneNumber = '';
    entryContact.message = '';
  } catch {
    isError.value = true;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Experience -->
    <section id="experience" class="py-24 px-4">
      <div class="max-w-4xl mx-auto">
        <h2
          class="text-3xl lg:text-5xl font-bold uppercase text-center text-[#2C3E50]"
        >
          Experience
        </h2>
        <SectionDivider />

        <div class="bg-[#727CF5]/[0.09] rounded-md p-6 lg:p-10">
          <div
            v-for="(experience, index) in experiences ?? []"
            :key="experience.id"
            class="grid grid-cols-1 md:grid-cols-[7rem_1.5rem_1fr] md:gap-x-4"
          >
            <!-- Date -->
            <p
              class="text-sm font-light text-slate-600 mb-1 md:mb-0 md:pt-1 md:text-right"
            >
              {{ experience.workingPeriode }}
            </p>

            <!-- Timeline marker: dot + connecting line down to the next entry -->
            <div class="hidden md:flex flex-col items-center">
              <span
                class="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-[#727CF5] bg-white"
              />
              <span
                v-if="index !== (experiences?.length ?? 0) - 1"
                class="mt-1 w-0.5 flex-1 bg-[#727CF5]/30"
              />
            </div>

            <!-- Content -->
            <div
              class="pb-8"
              :class="{
                'mb-8 border-b border-dashed border-slate-300':
                  index !== (experiences?.length ?? 0) - 1,
              }"
            >
              <h3 class="text-lg font-bold mb-2">
                {{ experience.company }} // {{ experience.position }} //
                {{ experience.location }}
              </h3>
              <p class="text-slate-700 mb-3">{{ experience.description }}</p>

              <p class="font-semibold mb-1">Role Summary:</p>
              <p class="text-slate-700 mb-3">{{ experience.roleSummary }}</p>

              <p class="font-semibold mb-1">Experiences gained:</p>
              <ul class="list-disc list-inside text-slate-700 mb-3">
                <li v-for="gained in experience.experienceGained" :key="gained">
                  {{ gained }}
                </li>
              </ul>

              <p class="font-semibold mb-1">Selected Projects:</p>
              <ul class="space-y-3">
                <li
                  v-for="project in experience.projects"
                  :key="project.id"
                  class="text-slate-700"
                >
                  <p class="font-medium">
                    {{ project.title }} //
                    <template v-if="project.url">
                      Link to app:
                      <a
                        :href="project.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-[#0E7C6B] underline"
                      >
                        {{ project.url }}
                      </a>
                    </template>
                    <template v-else>
                      Internal app, no preview link available
                    </template>
                    // {{ project.year }}
                  </p>
                  <p>
                    {{ project.description }} Using technologies:
                    <span
                      v-for="tech in project.technologies"
                      :key="tech"
                      class="inline-block px-2 py-0.5 mr-1 mt-1 rounded-full bg-white text-xs border border-slate-200"
                    >
                      {{ tech }}
                    </span>
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Portfolio -->
    <section id="portfolio" class="py-24 px-4">
      <div class="max-w-5xl mx-auto">
        <h2
          class="text-3xl lg:text-5xl font-bold uppercase text-center text-[#2C3E50]"
        >
          Portfolio
        </h2>
        <SectionDivider />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
          <div
            v-for="project in portfolioEntries"
            :key="project.id"
            class="max-w-sm mx-auto"
          >
            <button
              type="button"
              class="relative block w-full rounded-lg overflow-hidden group"
              @click="openPortfolio(project)"
            >
              <img
                :src="project.image[0] || IMAGE_NOT_AVAILABLE"
                :alt="project.title"
                loading="lazy"
                class="w-full h-52 object-cover"
                @error="onImageError"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-[#0E7C6B]/90 opacity-0 group-hover:opacity-100 transition-opacity text-white text-3xl font-light"
              >
                +
              </span>
            </button>
            <h3 class="mt-3 font-semibold">{{ project.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- About -->
    <section id="about" class="py-24 px-4 bg-[#0E7C6B] text-white">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl lg:text-5xl font-bold uppercase">About</h2>
        <SectionDivider light />
        <p class="text-lg leading-relaxed">{{ siteProfile?.bio }}</p>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="py-24 px-4">
      <div class="max-w-lg mx-auto">
        <h2
          class="text-3xl lg:text-5xl font-bold uppercase text-center text-[#2C3E50]"
        >
          Contact Me
        </h2>
        <SectionDivider />

        <form
          v-if="!businessCardShown"
          class="space-y-4 mt-6"
          @submit.prevent="submitContact"
        >
          <div>
            <label for="fullname" class="block text-sm font-medium mb-1"
              >Full name</label
            >
            <input
              id="fullname"
              v-model="entryContact.fullname"
              type="text"
              required
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#0E7C6B]"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium mb-1"
              >Email address</label
            >
            <input
              id="email"
              v-model="entryContact.email"
              type="email"
              required
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#0E7C6B]"
            />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium mb-1"
              >Phone number</label
            >
            <input
              id="phone"
              v-model="entryContact.phoneNumber"
              type="tel"
              required
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#0E7C6B]"
            />
          </div>

          <div>
            <label for="message" class="block text-sm font-medium mb-1"
              >Message</label
            >
            <textarea
              id="message"
              v-model="entryContact.message"
              required
              rows="5"
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#0E7C6B]"
            />
          </div>

          <p
            v-if="isSubmitted && !isError"
            class="text-center font-semibold text-green-600"
          >
            Form submission successful!
          </p>
          <p v-if="isError" class="text-center text-red-600">
            Error sending message!
          </p>

          <div class="flex justify-center gap-3">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-3 rounded bg-[#0E7C6B] text-white font-bold disabled:opacity-50"
            >
              {{ isSubmitting ? 'Sending...' : 'Send' }}
            </button>
            <button
              type="button"
              class="px-6 py-3 rounded bg-[#2C3E50] text-white font-bold"
              @click="toggleBusinessCard"
            >
              Get Business Card
            </button>
          </div>
        </form>

        <div v-else class="text-center mt-6">
          <div class="border border-slate-200 rounded-lg p-6 mb-4 text-left">
            <h3 class="text-xl font-bold mb-1">Nurfirliana Muzanella</h3>
            <p class="text-slate-600 mb-4">Frontend Engineer</p>
            <hr class="mb-4" />
            <p class="mb-2">muzanella11@gmail.com</p>
            <p class="mb-2">087867701092</p>
            <p>Griya Bukit Jaya. Blok M 11/27. Gunung Putri, Bogor</p>
          </div>
          <button
            type="button"
            class="px-6 py-3 rounded bg-[#2C3E50] text-white font-bold"
            @click="toggleBusinessCard"
          >
            Send Message
          </button>
        </div>
      </div>
    </section>

    <PortfolioModal
      :project="activePortfolio"
      @close="activePortfolio = null"
    />
  </div>
</template>
