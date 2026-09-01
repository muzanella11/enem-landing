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

const { data: experiences } = await useFetch<Experience[]>('/api/experiences');
const { data: siteProfile } = await useFetch<SiteProfile>('/api/site-profile');

// SEO meta is optional content (managed via enem-landing-cms) - fall back
// to sensible defaults rather than a hard failure when nothing's been set
// for this page yet.
const DEFAULT_SEO = {
  title: 'Nurfirliana Muzanella',
  description:
    "Hello, I'm Frontend Engineer. Combine the art of design with the art of programming.",
};
// `useFetch` doesn't throw on a non-2xx response, it just leaves `data`
// null - no seo-meta row yet for "home" falls straight through to the
// defaults below.
const { data: seoResponse } = await useFetch<SeoMeta>('/api/seo-meta/home');
useSeoMeta({
  title: seoResponse.value?.title ?? DEFAULT_SEO.title,
  description: seoResponse.value?.description ?? DEFAULT_SEO.description,
  ogTitle: seoResponse.value?.title ?? DEFAULT_SEO.title,
  ogDescription: seoResponse.value?.description ?? DEFAULT_SEO.description,
  ogImage: seoResponse.value?.ogImageUrl || undefined,
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

        <div
          class="bg-[#727CF5]/[0.09] border-l-4 border-[#727CF5] rounded-r-md p-6 lg:p-10"
        >
          <div
            v-for="(experience, index) in experiences ?? []"
            :key="experience.id"
            class="pb-8 mb-8"
            :class="{
              'border-b border-dashed border-slate-300':
                index !== (experiences?.length ?? 0) - 1,
            }"
          >
            <p class="text-sm font-light text-slate-500 mb-1">
              {{ experience.workingPeriode }}
            </p>
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
                      class="text-[#1ABC9C] hover:underline"
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
                alt=""
                class="w-full h-52 object-cover"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-[#1ABC9C]/90 opacity-0 group-hover:opacity-100 transition-opacity text-white text-3xl font-light"
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
    <section id="about" class="py-24 px-4 bg-[#1ABC9C] text-white">
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
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#1ABC9C]"
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
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#1ABC9C]"
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
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#1ABC9C]"
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
              class="w-full px-3 py-2 border-b-2 border-slate-300 focus:outline-none focus:border-[#1ABC9C]"
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
              class="px-6 py-3 rounded bg-[#1ABC9C] text-white font-bold disabled:opacity-50"
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
