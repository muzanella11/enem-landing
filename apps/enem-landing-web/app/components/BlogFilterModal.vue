<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { BlogTaxonomyWithCount } from '@enem-landing/shared-types';

const props = defineProps<{
  open: boolean;
  categories: BlogTaxonomyWithCount[];
  tags: BlogTaxonomyWithCount[];
  category: string | null;
  tag: string | null;
}>();
const emit = defineEmits<{
  close: [];
  apply: [value: { category: string | null; tag: string | null }];
}>();

// Draft selection: only applied on "Apply", so closing the modal discards it.
const draftCategory = ref<string | null>(null);
const draftTag = ref<string | null>(null);
const tagSearch = ref('');

const filteredTags = computed(() => {
  const needle = tagSearch.value.trim().toLowerCase();
  return needle
    ? props.tags.filter((tag) => tag.name.toLowerCase().includes(needle))
    : props.tags;
});

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close');
};

watch(
  () => props.open,
  (open) => {
    if (!import.meta.client) return;
    if (open) {
      draftCategory.value = props.category;
      draftTag.value = props.tag;
      tagSearch.value = '';
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeydown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeydown);
    }
  },
);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKeydown);
});

const toggle = (current: string | null, slug: string) =>
  current === slug ? null : slug;

const apply = () =>
  emit('apply', { category: draftCategory.value, tag: draftTag.value });

const reset = () => {
  draftCategory.value = null;
  draftTag.value = null;
  tagSearch.value = '';
};

const optionClass = (selected: boolean) =>
  selected
    ? 'bg-[#0E7C6B] text-white border-[#0E7C6B]'
    : 'bg-white text-[#2C3E50] border-black/10 hover:border-[#0E7C6B]';
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    @click.self="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-filter-title"
      class="bg-white w-full sm:max-w-lg rounded-t-lg sm:rounded-lg flex flex-col max-h-[85vh]"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-black/5"
      >
        <h2 id="blog-filter-title" class="text-lg font-bold text-[#2C3E50]">
          Filter posts
        </h2>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-700 text-2xl leading-none"
          aria-label="Close"
          @click="emit('close')"
        >
          &times;
        </button>
      </div>

      <div class="px-5 py-4 overflow-y-auto flex-1">
        <h3
          class="text-xs font-bold uppercase tracking-wide text-black/60 mb-2"
        >
          Category
        </h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            v-for="item in categories"
            :key="item.id"
            type="button"
            :aria-pressed="draftCategory === item.slug"
            class="px-3 py-1 rounded-full border text-xs font-bold uppercase transition-colors"
            :class="optionClass(draftCategory === item.slug)"
            @click="draftCategory = toggle(draftCategory, item.slug)"
          >
            {{ item.name }}
            <span class="font-normal opacity-60">{{ item.postCount }}</span>
          </button>
        </div>

        <h3
          class="text-xs font-bold uppercase tracking-wide text-black/60 mb-2"
        >
          Tag
        </h3>
        <input
          v-model="tagSearch"
          type="search"
          placeholder="Search tags"
          aria-label="Search tags"
          class="w-full mb-3 px-3 py-2 rounded border border-black/10 text-sm focus:outline-none focus:border-[#0E7C6B]"
        />
        <div class="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
          <button
            v-for="item in filteredTags"
            :key="item.id"
            type="button"
            :aria-pressed="draftTag === item.slug"
            class="px-3 py-1 rounded-full border text-xs transition-colors"
            :class="optionClass(draftTag === item.slug)"
            @click="draftTag = toggle(draftTag, item.slug)"
          >
            #{{ item.name }}
            <span class="opacity-60">{{ item.postCount }}</span>
          </button>
          <p v-if="filteredTags.length === 0" class="text-sm text-black/60">
            No tags match "{{ tagSearch }}".
          </p>
        </div>
      </div>

      <div class="flex justify-between gap-3 px-5 py-4 border-t border-black/5">
        <button
          type="button"
          class="px-4 py-2 rounded text-sm font-bold text-[#2C3E50] hover:bg-[#2C3E50]/5"
          @click="reset"
        >
          Reset
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded text-sm font-bold bg-[#0E7C6B] text-white hover:bg-[#0B6657]"
          @click="apply"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</template>
