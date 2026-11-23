<script lang="ts" setup>
defineProps<{
  label: string;
  value: string | number | null | undefined;
  tone?: 'error' | 'warning' | 'success';
}>();
</script>

<template>
  <div class="stat-line">
    <span class="stat-line__label">{{ label }}</span>
    <span :class="['stat-line__value', tone ? `text-${tone}` : '']">{{
      value ?? '-'
    }}</span>
  </div>
</template>

<style scoped>
.stat-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.stat-line__label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

.stat-line__value {
  font-size: 18px;
  font-weight: 700;
}
</style>
