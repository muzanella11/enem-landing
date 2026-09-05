<script lang="ts" setup>
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <div class="c-page-header">
    <div class="c-page-header__titles">
      <h1 class="c-page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="c-page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="c-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss">
.c-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.87);
    margin: 0;
  }

  &__subtitle {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.45);
    margin: 4px 0 0;
  }
}
</style>
