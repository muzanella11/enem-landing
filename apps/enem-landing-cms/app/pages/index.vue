<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' });

const links = [
  { title: 'Experiences', icon: 'mdi-briefcase-outline', url: '/experiences' },
  {
    title: 'Contact Submissions',
    icon: 'mdi-email-outline',
    url: '/contact-submissions',
  },
  { title: 'Site Profile', icon: 'mdi-account-outline', url: '/site-profile' },
  { title: 'SEO Meta', icon: 'mdi-magnify', url: '/seo-meta' },
  { title: 'Skills', icon: 'mdi-star-outline', url: '/skills' },
  { title: 'Settings', icon: 'mdi-cog-outline', url: '/settings' },
];
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Dashboard"
      subtitle="Kelola konten enem-landing dari satu tempat."
    />

    <CContentCard title="Menu">
      <v-list nav density="compact">
        <v-list-item
          v-for="link in links"
          :key="link.url"
          :to="link.url"
          :prepend-icon="link.icon"
          :title="link.title"
          rounded="lg"
          color="primary"
        />
      </v-list>
    </CContentCard>
  </div>
</template>
