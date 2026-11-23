import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { errorMessage } from './use-logs-api';

/** Loads on mount and every `intervalMs` while the component lives. */
export const usePoll = <T>(
  load: () => Promise<T>,
  intervalMs = 30_000,
): {
  data: Ref<T | null>;
  error: Ref<string>;
  loading: Ref<boolean>;
  refresh: () => Promise<void>;
} => {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref('');
  const loading = ref(false);
  const refresh = async () => {
    loading.value = true;
    try {
      data.value = await load();
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
    if (intervalMs > 0) timer = setInterval(refresh, intervalMs);
  });
  onBeforeUnmount(() => clearInterval(timer));
  return { data, error, loading, refresh };
};
