import { computed } from 'vue';
import { useAppStore } from '../stores/app.js';

/**
 * Ported from mau-apps
 * (`libs/frontend/src/composables/components/use-global-snackbar.ts`).
 * Kept flat under `composables/` here rather than mau's nested
 * `composables/components/` subfolder — this is the only "component-ish"
 * composable in this lib so far; revisit the nesting if a second one
 * (mau also has `use-field-rules`/`use-form-validation`) shows up.
 */
export const useGlobalSnackbar = () => {
  const appStore = useAppStore();

  const state = computed(() => appStore.$state.snackbar);

  const success = (text: string) => {
    appStore.$patch({ snackbar: { opened: true, text, color: 'success' } });
  };

  const error = (err: Error | unknown) => {
    appStore.$patch({
      snackbar: { opened: true, text: (err as Error)?.message ?? 'Terjadi kesalahan', color: 'error' },
    });
  };

  const reset = (delay = 0) => {
    setTimeout(() => {
      appStore.$patch({ snackbar: { opened: false, text: '', color: 'success' } });
    }, delay);
  };

  return { state, success, error, reset };
};
