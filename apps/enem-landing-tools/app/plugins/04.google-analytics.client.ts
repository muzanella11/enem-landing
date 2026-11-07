import { loadGoogleAnalytics } from '@enem-landing/frontend/tracking';

/**
 * GA4 for tools.muzanella.com. Analytics cookies need consent (UU PDP), so
 * gtag.js loads only after the visitor chose "Setuju" (`granted`), never
 * on `denied` or before a choice. It also waits until a share-link
 * fragment is gone from the URL, so GA never sees shared tool input, and
 * stays off on embedded widgets like the other trackers.
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
      if (choice === 'granted' && cleared) loadGoogleAnalytics(measurementId);
    },
    { immediate: true },
  );
});
