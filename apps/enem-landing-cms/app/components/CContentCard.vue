<script lang="ts" setup>
defineProps<{
  title: string;
  meta?: string;
  noPadding?: boolean;
}>();
</script>

<template>
  <v-card class="c-content-card" rounded="lg" elevation="0">
    <div class="c-content-card__header">
      <span class="c-content-card__title">{{ title }}</span>
      <span v-if="meta" class="c-content-card__meta">{{ meta }}</span>
      <slot name="header-right" />
    </div>
    <v-divider />
    <div
      :class="[
        'c-content-card__body',
        { 'c-content-card__body--no-padding': noPadding },
      ]"
    >
      <slot />
    </div>
  </v-card>
</template>

<style lang="scss">
.c-content-card {
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  display: flex !important;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 12px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }

  &__meta {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.4);
    margin-left: auto;
    margin-right: 0;
  }

  &__body {
    padding: 20px;

    &--no-padding {
      padding: 0;
    }
  }
}
</style>
