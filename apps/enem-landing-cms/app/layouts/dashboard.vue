<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { useRoute } from 'vue-router';
import { useAuthentication } from '@enem-landing/frontend';

interface NavItem {
  title: string;
  icon: string;
  url: string;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', url: '/' },
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

const { authUser, removeAccessToken } = useAuthentication();
const { mobile } = useDisplay();
const route = useRoute();

const isNavItemActive = (url: string) =>
  url === '/' ? route.path === '/' : route.path.startsWith(url);

const rail = ref(false);
const drawer = ref(!mobile.value);
const profileMenu = ref(false);

const toggleDrawer = () => {
  if (mobile.value) {
    drawer.value = !drawer.value;
  } else {
    rail.value = !rail.value;
  }
};

const drawerIcon = computed(() => {
  if (mobile.value) return drawer.value ? 'mdi-close' : 'mdi-menu';
  return rail.value ? 'mdi-menu' : 'mdi-menu-open';
});

const initials = computed(() => {
  if (!authUser.value?.fullname) return '';
  return authUser.value.fullname
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
});
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :rail="!mobile && rail"
      :rail-width="64"
      border="r"
    >
      <div class="d-flex align-center pa-3" style="height: 60px">
        <v-avatar color="primary" size="36">
          <v-icon color="white" size="20">mdi-view-dashboard</v-icon>
        </v-avatar>
        <span v-if="!rail" class="ml-3 font-weight-medium">enem-landing</span>
      </div>

      <v-divider />

      <v-list nav density="compact">
        <v-list-item
          v-for="item in NAV_ITEMS"
          :key="item.url"
          :to="item.url"
          :active="isNavItemActive(item.url)"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
          color="primary"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar elevation="0" border="b" height="60">
      <v-btn
        :icon="drawerIcon"
        variant="text"
        density="comfortable"
        class="ml-1"
        @click="toggleDrawer"
      />

      <v-spacer />

      <v-menu
        v-model="profileMenu"
        location="bottom end"
        :offset="[8, 0]"
        :close-on-content-click="false"
      >
        <template #activator="{ props: menuProps }">
          <v-avatar v-bind="menuProps" color="primary" size="34" class="mr-3">
            <span class="text-caption font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </template>

        <v-card min-width="240" elevation="4">
          <v-card-text>
            <div class="font-weight-medium">{{ authUser?.fullname }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ authUser?.email }}
            </div>
            <v-chip
              v-if="authUser?.role"
              size="x-small"
              color="primary"
              variant="tonal"
              class="mt-2"
            >
              {{ authUser.role }}
            </v-chip>
          </v-card-text>

          <v-divider />

          <v-list nav density="compact">
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign out"
              rounded="lg"
              @click="
                removeAccessToken();
                profileMenu = false;
              "
            />
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>
