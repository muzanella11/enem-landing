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
    // ofetch/ Nuxt's `$fetch` wraps a non-2xx response into a FetchError
    // whose own `.message` is a generic string like `[POST] "/api/x": 400
    // Bad Request` - it does NOT carry the real backend error text. The
    // actual message (e.g. a NestJS BadRequestException's message, relayed
    // through a BFF route's `createError({ statusMessage })`) surfaces via
    // `.statusMessage` (h3 sets the HTTP reason phrase to it) or
    // `.data.message`/`.data.statusMessage` (the parsed JSON error body) -
    // prefer those before falling back to the generic wrapper text.
    const fetchErr = err as {
      data?: { message?: string; statusMessage?: string };
      statusMessage?: string;
      message?: string;
    };
    const text =
      fetchErr?.data?.message ??
      fetchErr?.data?.statusMessage ??
      fetchErr?.statusMessage ??
      fetchErr?.message ??
      'Terjadi kesalahan';
    appStore.$patch({ snackbar: { opened: true, text, color: 'error' } });
  };

  const reset = (delay = 0) => {
    setTimeout(() => {
      appStore.$patch({ snackbar: { opened: false, text: '', color: 'success' } });
    }, delay);
  };

  return { state, success, error, reset };
};
