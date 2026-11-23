<script lang="ts" setup>
import type { LogSourceInfo } from '@enem-landing/shared-types';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  cleanQuery,
  formatBytes,
  formatDateTime,
  VIEWER_QUERY_KEYS,
} from '../utils/log-format';

/** List of host log sources on the left, the matching viewer on the right. */
const props = defineProps<{ sources: LogSourceInfo[] }>();

const route = useRoute();
const router = useRouter();
// `?source=<id>` (deep link) selects a source.
const selectedId = ref<string | null>(
  typeof route.query.source === 'string' ? route.query.source : null,
);
watch(
  () => props.sources,
  (sources) => {
    if (!sources.length) return;
    if (!sources.some((source) => source.id === selectedId.value)) {
      selectedId.value = sources[0]?.id ?? null;
    }
  },
  { immediate: true },
);
const select = (id: string) => {
  if (id === selectedId.value) return;
  selectedId.value = id;
  // A different source starts from its newest lines.
  router.replace({
    query: { ...cleanQuery(route.query, VIEWER_QUERY_KEYS), source: id },
  });
};

const selected = computed(() =>
  props.sources.find((source) => source.id === selectedId.value),
);
const latest = (source: LogSourceInfo) => source.files[0];
</script>

<template>
  <v-row no-gutters>
    <v-col cols="12" md="3" class="source-panel__list">
      <v-list density="compact" nav>
        <v-list-item
          v-for="source in sources"
          :key="source.id"
          :active="source.id === selectedId"
          color="primary"
          rounded="lg"
          :data-testid="`source-${source.id}`"
          @click="select(source.id)"
        >
          <v-list-item-title>{{ source.label }}</v-list-item-title>
          <v-list-item-subtitle>
            <template v-if="source.format === 'journal'">journald</template>
            <template v-else-if="latest(source)">
              {{ formatBytes(latest(source)?.size) }} ·
              {{ formatDateTime(latest(source)?.modifiedAt) }}
            </template>
            <template v-else>tidak ada</template>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-col>
    <v-col cols="12" md="9">
      <template v-if="selected">
        <div class="px-4 pt-3 text-caption text-medium-emphasis">
          {{ selected.description }}
        </div>
        <JournalViewer v-if="selected.format === 'journal'" />
        <RecordTable
          v-else-if="
            selected.format === 'utmp' ||
            selected.format === 'lastlog' ||
            selected.format === 'faillog'
          "
          :key="selected.id"
          :endpoint="`sources/${selected.id}/entries`"
          :files="selected.files"
          :format="selected.format"
        />
        <LogViewer
          v-else
          :key="selected.id"
          :endpoint="`sources/${selected.id}/entries`"
          :files="selected.files"
          :kind="selected.format === 'mysql-slow' ? 'mysql-slow' : 'text'"
          :title="selected.id"
          :follow-endpoint="
            selected.format === 'text'
              ? `sources/${selected.id}/follow`
              : undefined
          "
          :seek-endpoint="
            selected.format === 'text'
              ? `sources/${selected.id}/seek`
              : undefined
          "
        />
      </template>
    </v-col>
  </v-row>
</template>

<style scoped>
.source-panel__list {
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
