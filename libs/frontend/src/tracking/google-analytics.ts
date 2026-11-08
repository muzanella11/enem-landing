/**
 * Google Analytics 4 (gtag.js), shared by the landing and tools sites.
 * The measurement id is read at runtime (`NUXT_PUBLIC_GA_MEASUREMENT_ID`)
 * so it can't silently drop out of a build again. GA4's own automatic
 * page_view (initial load + history changes) is used as is.
 *
 * Story 56: GA4 is for search (Search Console) and AdSense revenue per
 * page; the in-house tracker stays the source of truth for usage, so only
 * a handful of events are mirrored here (see `trackGaEvent`).
 */
import { whenEngaged, whenIdle } from './when-idle.js';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/**
 * Regions where Google requires consent before ad/analytics storage: the
 * EEA, the UK, and Switzerland. Google's own CMP (AdSense "Privacy &
 * messaging") asks visitors there and updates consent mode; everyone
 * else keeps the current behaviour (no banner, `granted`).
 */
export const CONSENT_REQUIRED_REGIONS: readonly string[] = [
  // EU
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  // Rest of the EEA, the UK, Switzerland
  'IS',
  'LI',
  'NO',
  'GB',
  'CH',
];

const CONSENT_TYPES = [
  'ad_storage',
  'ad_user_data',
  'ad_personalization',
  'analytics_storage',
] as const;

const consentState = (value: 'granted' | 'denied') =>
  Object.fromEntries(CONSENT_TYPES.map((type) => [type, value]));

/** Only GA4 ids (`G-XXXXXXXXXX`); old `UA-` ids stopped collecting in 2023. */
export const isGaMeasurementId = (
  id: string | null | undefined,
): id is string => /^G-[A-Z0-9]{4,20}$/.test((id ?? '').trim());

/**
 * Sets the Consent Mode v2 defaults: denied in `CONSENT_REQUIRED_REGIONS`
 * (until the CMP updates it), granted everywhere else. Must run before
 * `config`. The most specific matching region wins, whatever the order.
 */
export const setDefaultConsent = (gtag: Gtag): void => {
  gtag('consent', 'default', {
    ...consentState('denied'),
    region: [...CONSENT_REQUIRED_REGIONS],
    wait_for_update: 500,
  });
  gtag('consent', 'default', consentState('granted'));
};

/**
 * Sets up gtag once and configures `measurementId`; gtag.js itself is
 * fetched on the visitor's first interaction (or 8s after load) and then
 * when the browser is idle, while calls made before that wait in
 * `dataLayer`. No-op on the server, for an invalid id, or when already
 * set up. Returns whether GA is active.
 */
export const loadGoogleAnalytics = (
  measurementId: string | null | undefined,
): boolean => {
  if (typeof window === 'undefined' || !isGaMeasurementId(measurementId)) {
    return false;
  }
  const id = measurementId.trim();
  if (window.gtag || document.querySelector('script[data-gtag]')) return true;

  window.dataLayer = window.dataLayer || [];
  const gtag: Gtag = function gtag() {
    // gtag.js expects the `arguments` object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;
  setDefaultConsent(gtag);
  gtag('js', new Date());
  gtag('config', id);

  whenEngaged(() =>
    whenIdle(() => {
      if (document.querySelector('script[data-gtag]')) return;
      const script = document.createElement('script');
      script.async = true;
      script.dataset['gtag'] = '1';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);
    }),
  );
  return true;
};

/** Event parameter values GA receives: ids and labels only, never user input. */
export type GaEventParams = Record<string, string | number | undefined>;

/**
 * Sends one GA4 event. No-op on the server and while GA isn't set up
 * (no measurement id, embedded widget, share fragment not cleared yet),
 * so callers never need to check. Undefined params are dropped.
 */
export const trackGaEvent = (
  name: string,
  params: GaEventParams = {},
): boolean => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return false;
  }
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
  window.gtag('event', name, clean);
  return true;
};
