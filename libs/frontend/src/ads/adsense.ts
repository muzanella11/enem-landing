/**
 * Framework-free AdSense helpers shared by the tools hub and the blog
 * (Story 20, 27, 56). Each app keeps its own small Vue component for
 * layout and decides when a slot may load; this module only handles the
 * script and the ad queue.
 */
import { whenIdle } from '../tracking/when-idle.js';

type AdsQueue = unknown[] & { requestNonPersonalizedAds?: number };

declare global {
  interface Window {
    adsbygoogle?: AdsQueue;
  }
}

const SCRIPT_SELECTOR = 'script[data-adsbygoogle]';

/** `ca-pub-` followed by the publisher number, as the CMS validates it. */
export const isAdsenseClientId = (
  id: string | null | undefined,
): id is string => /^ca-pub-\d{10,20}$/.test((id ?? '').trim());

/** Numeric `data-ad-slot` of an ad unit. */
export const isAdsenseSlotId = (id: string | null | undefined): id is string =>
  /^\d{6,20}$/.test((id ?? '').trim());

/** Appends adsbygoogle.js once. No-op on the server or for an invalid id. */
export const loadAdsenseScript = (
  clientId: string | null | undefined,
): void => {
  if (typeof window === 'undefined' || !isAdsenseClientId(clientId)) return;
  if (document.querySelector(SCRIPT_SELECTOR)) return;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset['adsbygoogle'] = '1';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId.trim())}`;
  document.head.appendChild(script);
};

/**
 * Loads adsbygoogle.js when the browser is idle, before any slot scrolls
 * into view. The AdSense tag is what shows Google's consent message (CMP)
 * to visitors from the EEA, the UK, and Switzerland, so it has to run
 * early on pages that show ads, while the slots themselves stay lazy.
 */
export const preloadAdsenseScript = (
  clientId: string | null | undefined,
): void => {
  if (typeof window === 'undefined' || !isAdsenseClientId(clientId)) return;
  whenIdle(() => loadAdsenseScript(clientId));
};

/**
 * Asks AdSense to fill the `<ins class="adsbygoogle">` rendered just
 * before this call. `nonPersonalized` is only ever set to opt OUT; it is
 * left untouched otherwise so the consent signal from Google's CMP decides
 * for visitors in consent regions. Ad errors never reach the page.
 */
export const pushAdsenseSlot = (
  options: { nonPersonalized?: boolean } = {},
): void => {
  if (typeof window === 'undefined') return;
  const queue: AdsQueue = (window.adsbygoogle = window.adsbygoogle || []);
  if (options.nonPersonalized) queue.requestNonPersonalizedAds = 1;
  try {
    queue.push({});
  } catch {
    // Ad errors never affect the page.
  }
};
