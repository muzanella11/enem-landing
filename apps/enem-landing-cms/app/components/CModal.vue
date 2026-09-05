<script lang="ts" setup>
defineProps<{
  modelValue: boolean;
  title?: string;
  icon?: string;
  maxWidth?: string | number;
  persistent?: boolean;
  scrollable?: boolean;
  noPadding?: boolean;
}>();

defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth ?? 480"
    :persistent="persistent"
    :scrollable="scrollable"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="c-modal" rounded="lg">
      <div class="c-modal__header">
        <v-icon v-if="icon" class="c-modal__icon" size="20">{{ icon }}</v-icon>
        <slot name="title">{{ title }}</slot>
      </div>
      <v-divider />
      <v-card-text
        :class="['c-modal__body', { 'c-modal__body--no-padding': noPadding }]"
      >
        <slot />
      </v-card-text>
      <template v-if="$slots.actions">
        <v-divider />
        <div class="c-modal__actions">
          <v-spacer />
          <slot name="actions" />
        </div>
      </template>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
.c-modal {
  &__header {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    font-size: 15px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }

  &__icon {
    margin-right: 8px;
  }

  &__body {
    padding: 20px !important;

    &--no-padding {
      padding: 0 !important;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    gap: 8px;
  }
}
</style>
