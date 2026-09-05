<script lang="ts" setup>
import CPageHeader from './CPageHeader.vue';
import CContentCard from './CContentCard.vue';

defineProps<{
  title: string;
  subtitle?: string;
  cardTitle?: string;
  meta?: string;
}>();
</script>

<template>
  <div class="c-list-page">
    <CPageHeader :title="title" :subtitle="subtitle">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </CPageHeader>
    <slot name="prepend" />
    <CContentCard :title="cardTitle ?? title" :meta="meta" no-padding>
      <div v-if="$slots.filters" class="c-list-page__filters">
        <slot name="filters" />
      </div>
      <slot />
    </CContentCard>
  </div>
</template>

<style lang="scss">
.c-list-page {
  padding: 28px;

  &__filters {
    padding: 12px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
}
</style>
