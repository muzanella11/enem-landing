<script setup lang="ts">
import { formatThousands, parseRupiah } from '~/utils/format';

const model = defineModel<number>({ default: 0 });
const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    hint?: string;
    prefix?: string;
    allowDecimal?: boolean;
    /** Keep the label for screen readers only. */
    hideLabel?: boolean;
  }>(),
  { hint: undefined, prefix: 'Rp', allowDecimal: false, hideLabel: false },
);

const text = ref(model.value ? formatThousands(model.value) : '');

watch(model, (value) => {
  if (parseRupiah(text.value) !== value) {
    text.value = value ? formatThousands(value) : '';
  }
});

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = parseRupiah(target.value);
  model.value = props.allowDecimal ? value : Math.round(value);
  text.value = value ? formatThousands(value) : '';
  target.value = text.value;
};
</script>

<template>
  <div>
    <label :for="id" :class="hideLabel ? 'sr-only' : 'field-label'">{{
      label
    }}</label>
    <div class="relative">
      <span
        v-if="prefix"
        class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
        >{{ prefix }}</span
      >
      <input
        :id="id"
        :value="text"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="field-input tabular"
        :class="prefix ? 'pl-10' : ''"
        @input="onInput"
      />
    </div>
    <p v-if="hint" class="field-hint">{{ hint }}</p>
  </div>
</template>
