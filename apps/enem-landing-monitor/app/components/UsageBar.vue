<script lang="ts" setup>
import { computed } from 'vue';
import { formatPercent, usageTone } from '../utils/log-format';

/** Used vs limit as a bar; red above 85%. */
const props = defineProps<{
  percent: number | null | undefined;
  label?: string;
  detail?: string;
  warning?: number;
  error?: number;
}>();

const tone = computed(
  () => usageTone(props.percent, props.warning, props.error) ?? 'grey',
);
</script>

<template>
  <div class="usage-bar">
    <div class="usage-bar__head">
      <span v-if="label" class="usage-bar__label">{{ label }}</span>
      <span :class="['usage-bar__value', `text-${tone}`]">{{
        formatPercent(percent)
      }}</span>
    </div>
    <v-progress-linear
      :model-value="Math.min(100, percent ?? 0)"
      :color="tone"
      height="6"
      rounded
    />
    <div v-if="detail" class="usage-bar__detail">{{ detail }}</div>
  </div>
</template>

<style scoped>
.usage-bar__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
  gap: 8px;
}

.usage-bar__label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.usage-bar__value {
  font-size: 13px;
  font-weight: 700;
}

.usage-bar__detail {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 2px;
}
</style>
