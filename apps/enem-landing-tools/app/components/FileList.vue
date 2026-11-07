<script setup lang="ts">
import type { PickedFile } from '~/composables/use-file-list';
import { formatBytes } from '~/utils/files';

defineProps<{ files: PickedFile[]; reorderable?: boolean }>();
const emit = defineEmits<{ remove: [string]; move: [number, number] }>();

const dragFrom = ref<number | null>(null);
const onDrop = (to: number) => {
  if (dragFrom.value !== null && dragFrom.value !== to)
    emit('move', dragFrom.value, to);
  dragFrom.value = null;
};
</script>

<template>
  <ol
    class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white"
  >
    <li
      v-for="(item, index) in files"
      :key="item.id"
      class="flex items-center gap-3 px-3 py-2 text-sm"
      :draggable="reorderable"
      @dragstart="dragFrom = index"
      @dragover.prevent
      @drop.prevent="onDrop(index)"
    >
      <span
        v-if="reorderable"
        class="cursor-grab select-none text-slate-400"
        aria-hidden="true"
        >⋮⋮</span
      >
      <span class="w-6 text-right text-slate-500">{{ index + 1 }}.</span>
      <span class="min-w-0 flex-1 truncate" :title="item.file.name">{{
        item.file.name
      }}</span>
      <span class="tabular text-slate-500">{{
        formatBytes(item.file.size)
      }}</span>
      <template v-if="reorderable">
        <button
          type="button"
          class="btn-link px-1"
          :disabled="index === 0"
          :aria-label="`Naikkan ${item.file.name}`"
          @click="emit('move', index, index - 1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="btn-link px-1"
          :disabled="index === files.length - 1"
          :aria-label="`Turunkan ${item.file.name}`"
          @click="emit('move', index, index + 1)"
        >
          ↓
        </button>
      </template>
      <button
        type="button"
        class="px-1 text-rose-700 hover:underline"
        :aria-label="`Hapus ${item.file.name}`"
        @click="emit('remove', item.id)"
      >
        Hapus
      </button>
    </li>
  </ol>
</template>
