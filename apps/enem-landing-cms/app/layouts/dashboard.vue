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
  { title: 'Cache', icon: 'mdi-memory', url: '/cache' },
  {
    title: 'Activity Tracking',
    icon: 'mdi-chart-line',
    url: '/activity-tracking',
  },
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

const avatarSrc = computed(() => {
  if (!authUser.value?.fullname) return '';
  const name = encodeURIComponent(authUser.value.fullname);
  return `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`;
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
      <div class="cms-nav-header d-flex align-center pa-3" style="height: 60px">
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

      <div class="cms-appbar-brand">
        <span class="cms-domain-dot" />
        <span class="cms-appbar-name">CMS</span>
      </div>

      <v-spacer />

      <v-menu
        v-model="profileMenu"
        location="bottom end"
        :offset="[8, 0]"
        :close-on-content-click="false"
      >
        <template #activator="{ props: menuProps }">
          <v-avatar
            v-bind="menuProps"
            :image="avatarSrc"
            color="primary"
            size="34"
            class="mr-3"
          >
            <span class="text-caption font-weight-bold">{{ initials }}</span>
          </v-avatar>
        </template>

        <v-card class="cms-profile-card" min-width="260" elevation="4">
          <div class="cms-profile-banner" />

          <div class="cms-profile-header">
            <v-avatar
              :image="avatarSrc"
              color="primary"
              size="72"
              class="cms-profile-avatar"
            >
              <span class="text-h5 font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <div class="cms-profile-name">{{ authUser?.fullname }}</div>
            <div v-if="authUser?.email" class="cms-profile-email">
              {{ authUser.email }}
            </div>
            <v-chip
              v-if="authUser?.role"
              size="x-small"
              color="primary"
              variant="tonal"
              class="mt-1"
            >
              {{ authUser.role }}
            </v-chip>
          </div>

          <v-divider />

          <v-list nav density="compact" class="pa-2">
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign out"
              rounded="lg"
              class="cms-profile-signout"
              @click="
                removeAccessToken();
                profileMenu = false;
              "
            />
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main class="cms-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.cms-nav-header {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.cms-appbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.cms-appbar-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.01em;
}

.cms-domain-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.cms-profile-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.cms-profile-banner {
  height: 56px;
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.6) 100%
  );
}

.cms-profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 16px 20px;
  text-align: center;
  margin-top: -36px;
}

.cms-profile-avatar {
  color: #fff;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cms-profile-name {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8px;
}

.cms-profile-email {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: -1px;
}

.cms-profile-signout {
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.cms-profile-signout:hover {
  opacity: 1;
}

.cms-main {
  background: #f5f5f7;
}
</style>
