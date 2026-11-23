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

// Each monitored part of the server is its own top-level menu; the
// dashboard sums up the most critical numbers from all of them.
const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', url: '/' },
  { title: 'Server', icon: 'mdi-server-outline', url: '/server' },
  { title: 'DB', icon: 'mdi-database-outline', url: '/db' },
  { title: 'Redis', icon: 'mdi-memory', url: '/redis' },
  { title: 'Apps', icon: 'mdi-application-brackets-outline', url: '/apps' },
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
      <div
        class="monitor-nav-header d-flex align-center pa-3"
        style="height: 60px"
      >
        <v-avatar color="primary" size="36">
          <v-icon color="white" size="20">mdi-monitor-dashboard</v-icon>
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

      <div class="monitor-appbar-brand">
        <span class="monitor-domain-dot" />
        <span class="monitor-appbar-name">Monitor</span>
      </div>

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

        <v-card class="monitor-profile-card" min-width="260" elevation="4">
          <div class="monitor-profile-banner" />

          <div class="monitor-profile-header">
            <v-avatar color="primary" size="72" class="monitor-profile-avatar">
              <span class="text-h5 font-weight-bold">{{ initials }}</span>
            </v-avatar>
            <div class="monitor-profile-name">{{ authUser?.fullname }}</div>
            <div v-if="authUser?.email" class="monitor-profile-email">
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
              class="monitor-profile-signout"
              @click="
                removeAccessToken();
                profileMenu = false;
              "
            />
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main class="monitor-main">
      <slot />
    </v-main>
  </v-app>
</template>

<style scoped>
.monitor-nav-header {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.monitor-appbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.monitor-appbar-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.01em;
}

.monitor-domain-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.monitor-profile-card {
  border-radius: 16px !important;
  overflow: hidden;
}

.monitor-profile-banner {
  height: 56px;
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgba(var(--v-theme-primary), 0.6) 100%
  );
}

.monitor-profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 16px 20px;
  text-align: center;
  margin-top: -36px;
}

.monitor-profile-avatar {
  color: #fff;
  border: 3px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.monitor-profile-name {
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 8px;
}

.monitor-profile-email {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: -1px;
}

.monitor-profile-signout {
  opacity: 0.6;
  transition: opacity 0.15s ease;
}

.monitor-profile-signout:hover {
  opacity: 1;
}

.monitor-main {
  background: #f5f5f7;
}
</style>
