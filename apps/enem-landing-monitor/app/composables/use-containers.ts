import type { ContainerList } from '@enem-landing/shared-types';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { errorMessage, logsFetch } from './use-logs-api';

/** Container list for a page, refreshed every 30 s (the reader caches 10 s). */
export const useContainers = () => {
  const list = ref<ContainerList | null>(null);
  const error = ref('');
  const loading = ref(false);

  const refresh = async () => {
    loading.value = true;
    try {
      list.value = await logsFetch<ContainerList>('containers');
      error.value = '';
    } catch (err) {
      error.value = errorMessage(err);
    } finally {
      loading.value = false;
    }
  };

  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    refresh();
    timer = setInterval(refresh, 30_000);
  });
  onBeforeUnmount(() => clearInterval(timer));

  return { list, error, loading, refresh };
};
