<script lang="ts" setup>
import CContentCard from './CContentCard.vue';
import CPageHeader from './CPageHeader.vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    sidebarTitle?: string;
    contentCols?: number;
    sidebarCols?: number;
  }>(),
  {
    subtitle: undefined,
    sidebarTitle: 'Aksi',
    contentCols: 9,
    sidebarCols: 3,
  },
);
</script>

<template>
  <div class="c-form-page">
    <CPageHeader :title="title" :subtitle="subtitle">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </CPageHeader>
    <v-row>
      <v-col cols="12" :md="contentCols">
        <slot />
      </v-col>
      <v-col v-if="$slots.sidebar" cols="12" :md="sidebarCols">
        <CContentCard :title="sidebarTitle">
          <slot name="sidebar" />
        </CContentCard>
      </v-col>
    </v-row>
  </div>
</template>
