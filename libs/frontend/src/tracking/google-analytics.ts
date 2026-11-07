/**
 * Google Analytics 4 (gtag.js), shared by the landing and tools sites.
 * The measurement id is read at runtime (`NUXT_PUBLIC_GA_MEASUREMENT_ID`)
 * so it can't silently drop out of a build again. GA4's own automatic
 * page_view (initial load + history changes) is used as is.
 */

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** Only GA4 ids (`G-XXXXXXXXXX`); old `UA-` ids stopped collecting in 2023. */
export const isGaMeasurementId = (
  id: string | null | undefined,
): id is string => /^G-[A-Z0-9]{4,20}$/.test((id ?? '').trim());

/**
 * Loads gtag.js once and configures `measurementId`. No-op on the server,
 * for an invalid id, or when already loaded. Returns whether GA is active.
 */
export const loadGoogleAnalytics = (
  measurementId: string | null | undefined,
): boolean => {
  if (typeof window === 'undefined' || !isGaMeasurementId(measurementId)) {
    return false;
  }
  const id = measurementId.trim();
  if (document.querySelector('script[data-gtag]')) return true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);

  const script = document.createElement('script');
  script.async = true;
  script.dataset['gtag'] = '1';
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  return true;
};
