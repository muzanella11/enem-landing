const IDLE_TIMEOUT_MS = 3000;
const AFTER_LOAD_DELAY_MS = 200;

/**
 * Runs `callback` once the browser is idle (or after `IDLE_TIMEOUT_MS` at
 * the latest), so third-party scripts like gtag.js and adsbygoogle.js never
 * compete with the page's own first render (LCP). Browsers without
 * `requestIdleCallback` (Safari) wait for the `load` event instead.
 */
export const whenIdle = (callback: () => void): void => {
  if (typeof window === 'undefined') return;
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => callback(), { timeout: IDLE_TIMEOUT_MS });
    return;
  }
  const later = () => window.setTimeout(callback, AFTER_LOAD_DELAY_MS);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
};
