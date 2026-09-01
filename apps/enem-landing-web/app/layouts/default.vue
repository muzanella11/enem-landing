<script lang="ts" setup>
import type { Skill, SiteProfile } from '@enem-landing/shared-types';
import Navigation from '../components/Navigation.vue';
import Masthead from '../components/Masthead.vue';
import Footer from '../components/Footer.vue';
import Copyright from '../components/Copyright.vue';

const { data: siteProfile } = await useFetch<SiteProfile>('/api/site-profile');
const { data: skills } = await useFetch<Skill[]>('/api/skills');
</script>

<template>
  <div>
    <Navigation :title="siteProfile?.heroTitle || 'Nurfirliana Muzanella'" />
    <Masthead
      :title="siteProfile?.heroTitle || 'Nurfirliana Muzanella'"
      :subheading="siteProfile?.heroSubtitle || 'Frontend Engineer'"
      :avatar-url="siteProfile?.avatarUrl || '/avataaars.svg'"
      :skills="skills ?? []"
    />
    <main>
      <slot />
    </main>
    <Footer :social-links="siteProfile?.socialLinks ?? []" />
    <Copyright />
  </div>
</template>
