<script lang="ts" setup>
import type { SiteProfile } from '@enem-landing/shared-types';
import Navigation from '../components/Navigation.vue';
import Footer from '../components/Footer.vue';
import Copyright from '../components/Copyright.vue';

const { data: siteProfile } = await useFetch<SiteProfile>('/api/site-profile');
</script>

<template>
  <div>
    <Navigation :title="siteProfile?.heroTitle || 'Nurfirliana Muzanella'" />
    <main class="pt-24 lg:pt-32">
      <slot />
    </main>
    <Footer :social-links="siteProfile?.socialLinks ?? []" />
    <Copyright />
  </div>
</template>
