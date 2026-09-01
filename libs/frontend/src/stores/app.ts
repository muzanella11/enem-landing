import { defineStore } from 'pinia';

export interface Snackbar {
  opened: boolean;
  text: string;
  color: 'success' | 'info' | 'error';
}

export interface AppState {
  isLoading: {
    list: boolean;
    page: boolean;
    form: boolean;
  };
  snackbar: Snackbar;
}

/**
 * Ported from mau-apps (`libs/frontend/src/stores/app.ts`) — shared global
 * app state consumed across every Nuxt app in the workspace (currently
 * `enem-landing-cms`, Story 07; other apps register the `@pinia/nuxt`
 * module too but don't consume this store yet).
 */
export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    isLoading: {
      list: false,
      form: false,
      page: false,
    },
    snackbar: {
      opened: false,
      text: '',
      color: 'info',
    },
  }),
});
