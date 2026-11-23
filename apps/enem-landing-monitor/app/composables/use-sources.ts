import type { LogSourceInfo } from '@enem-landing/shared-types';
import { onMounted, ref } from 'vue';
import { errorMessage, logsFetch } from './use-logs-api';

export const useSources = () => {
  const sources = ref<LogSourceInfo[]>([]);
  const error = ref('');
  const loading = ref(false);

  const refresh = async () => {
    loading.value = true;
    try {
      sources.value = await logsFetch<LogSourceInfo[]>('sources');
      error.value = '';
    } catch (err) {
      error.value = errorMessage(err);
    } finally {
      loading.value = false;
    }
  };
  onMounted(refresh);

  return { sources, error, loading, refresh };
};
