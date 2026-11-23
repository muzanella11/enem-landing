<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useContainers } from '../composables/use-containers';
import { useSources } from '../composables/use-sources';

definePageMeta({ layout: 'dashboard' });
useHead({ title: 'DB' });

const tab = ref('container');
const { list: containers } = useContainers();
const { sources, error } = useSources();
const slowSources = computed(() =>
  sources.value.filter((source) => source.group === 'db'),
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader
      title="DB"
      subtitle="MySQL self-host: log container (error log) dan slow query log."
    />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-card rounded="lg" elevation="0" class="c-content-card">
      <v-tabs v-model="tab" color="primary">
        <v-tab value="container">Container MySQL</v-tab>
        <v-tab value="slow">Slow query</v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="tab">
        <v-window-item value="container">
          <ContainerPanel
            :list="containers"
            category="db"
            empty-text="Container MySQL (stack mysql) tidak ditemukan di server."
          />
        </v-window-item>
        <v-window-item value="slow">
          <SourcePanel :sources="slowSources" />
        </v-window-item>
      </v-window>
    </v-card>
  </div>
</template>
