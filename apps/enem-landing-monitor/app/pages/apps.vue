<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContainerMetrics } from '../composables/use-container-metrics';
import { useContainers } from '../composables/use-containers';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'Apps' });

type Tab = 'apps-prod' | 'apps-dev' | 'memory';
const TABS: Tab[] = ['apps-prod', 'apps-dev', 'memory'];
const route = useRoute();
const router = useRouter();
const tab = ref<Tab>(
  TABS.includes(route.query.tab as Tab)
    ? (route.query.tab as Tab)
    : 'apps-prod',
);
watch(tab, (value) => {
  if (route.query.tab !== value) router.replace({ query: { tab: value } });
});
const { list: containers, error, refresh, loading } = useContainers();
const { data: metrics } = useContainerMetrics();
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="Apps"
      subtitle="Container aktif stack enem-landing (prod) dan enem-landing-dev (dev) dengan memory dibanding limit, plus container sebelumnya."
    >
      <template #actions>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="refresh"
          >Muat ulang</v-btn
        >
      </template>
    </CPageHeader>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="apps-prod">Prod</v-tab>
        <v-tab value="apps-dev">Dev</v-tab>
        <v-tab value="memory">Memory</v-tab>
      </v-tabs>
      <v-divider />
      <MemoryTable v-if="tab === 'memory'" :metrics="metrics" />
      <ContainerPanel
        v-else
        :key="tab"
        :list="containers"
        :category="tab"
        :metrics="metrics"
        empty-text="Tidak ada container di stack ini."
      />
    </v-card>
  </div>
</template>
