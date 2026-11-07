import { loadGoogleAnalytics } from '@enem-landing/frontend/tracking';

/**
 * GA4 for tools.muzanella.com. Loads while consent is `granted` (always,
 * for now, see use-consent.ts) and is switched off via Google's
 * `ga-disable-<id>` flag if it ever becomes `denied`. It waits until a
 * share-link fragment is gone from the URL, so GA never sees shared tool
 * input, and stays off on embedded widgets like the other trackers.
 */
export default defineNuxtPlugin(() => {
  if (window.location.pathname.startsWith('/embed/')) return;
  const measurementId = useRuntimeConfig().public.gaMeasurementId as string;
  if (!measurementId) return;

  const { state: consent } = useConsent();
  const fragmentCleared = useState('share-fragment-cleared', () => true);

  // loadGoogleAnalytics is idempotent, so later changes are harmless.
  watch(
    [consent, fragmentCleared],
    ([choice, cleared]) => {
      (window as unknown as Record<string, boolean>)[
        `ga-disable-${measurementId}`
      ] = choice === 'denied';
      if (choice === 'granted' && cleared) loadGoogleAnalytics(measurementId);
    },
    { immediate: true },
  );
});
