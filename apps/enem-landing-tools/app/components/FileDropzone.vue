<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    accept: string;
    multiple?: boolean;
    label: string;
    hint?: string;
  }>(),
  { multiple: true, hint: undefined },
);
const emit = defineEmits<{ files: [File[]] }>();

const input = ref<HTMLInputElement | null>(null);
const dragging = ref(false);

const acceptList = computed(() =>
  props.accept.split(',').map((item) => item.trim().toLowerCase()),
);
const matches = (file: File) =>
  acceptList.value.some((rule) =>
    rule.startsWith('.')
      ? file.name.toLowerCase().endsWith(rule)
      : rule.endsWith('/*')
        ? file.type.startsWith(rule.slice(0, -1))
        : file.type === rule,
  );

const take = (list: FileList | null) => {
  if (!list) return;
  const picked = Array.from(list).filter(matches);
  if (picked.length > 0)
    emit('files', props.multiple ? picked : picked.slice(0, 1));
};

const onDrop = (event: DragEvent) => {
  dragging.value = false;
  take(event.dataTransfer?.files ?? null);
};
const onChange = (event: Event) => {
  take((event.target as HTMLInputElement).files);
  (event.target as HTMLInputElement).value = '';
};
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition"
    :class="
      dragging ? 'border-primary bg-primary-50' : 'border-slate-300 bg-white'
    "
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <p class="font-semibold text-slate-800">{{ label }}</p>
    <p class="mt-1 text-sm text-slate-500">Seret file ke sini, atau</p>
    <button type="button" class="btn-primary mt-3" @click="input?.click()">
      Pilih file
    </button>
    <input
      ref="input"
      type="file"
      class="hidden"
      :accept="accept"
      :multiple="multiple"
      @change="onChange"
    />
    <p v-if="hint" class="mt-3 text-xs text-slate-500">{{ hint }}</p>
    <p class="mt-2 text-xs font-medium text-primary">
      File kamu diproses di perangkat ini dan tidak pernah di-upload.
    </p>
  </div>
</template>
