<script lang="ts" setup>
import { computed } from 'vue';

interface BarItem {
  label: string;
  value: number;
}

const props = defineProps<{
  items: BarItem[];
  emptyText?: string;
}>();

const maxValue = computed(() =>
  Math.max(1, ...props.items.map((item) => item.value)),
);
</script>

<template>
  <div class="c-bar-list">
    <p v-if="items.length === 0" class="text-caption text-medium-emphasis">
      {{ emptyText ?? 'No data yet.' }}
    </p>
    <div v-for="item in items" :key="item.label" class="c-bar-list__row">
      <span class="c-bar-list__label" :title="item.label">{{
        item.label
      }}</span>
      <div class="c-bar-list__track">
        <div
          class="c-bar-list__fill"
          :style="{ width: `${(item.value / maxValue) * 100}%` }"
        />
      </div>
      <span class="c-bar-list__value">{{ item.value }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.c-bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 2fr auto;
    align-items: center;
    gap: 10px;
  }

  &__label {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.72);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__track {
    height: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
    background: rgb(var(--v-theme-primary));
  }

  &__value {
    font-size: 12px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.6);
    min-width: 24px;
    text-align: right;
  }
}
</style>
