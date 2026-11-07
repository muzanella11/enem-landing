import { loadGoogleAnalytics } from '@enem-landing/frontend/tracking';

/** GA4 for muzanella.com. Inactive while the measurement id is unset. */
export default defineNuxtPlugin(() => {
  loadGoogleAnalytics(useRuntimeConfig().public.gaMeasurementId as string);
});
