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

/** First signs of a real visitor; any of these loads deferred scripts. */
const ENGAGEMENT_EVENTS = [
  'pointerdown',
  'keydown',
  'scroll',
  'touchstart',
] as const;
const DEFAULT_ENGAGEMENT_FALLBACK_MS = 8000;

/**
 * Runs `callback` once, on the visitor's first interaction (scroll, tap,
 * click, key) or `fallbackMs` after the `load` event, whichever comes
 * first. Used for gtag.js: its ~180 KB of script were the largest source
 * of Total Blocking Time on both sites even when loaded at idle, and a
 * page that nobody touches doesn't need it right away. Calls queued in
 * `dataLayer` before that are sent once it loads.
 */
export const whenEngaged = (
  callback: () => void,
  fallbackMs = DEFAULT_ENGAGEMENT_FALLBACK_MS,
): void => {
  if (typeof window === 'undefined') return;
  let done = false;
  let timer: number | undefined;
  const listenerOptions = { capture: true, passive: true } as const;
  const run = () => {
    if (done) return;
    done = true;
    if (timer !== undefined) window.clearTimeout(timer);
    for (const name of ENGAGEMENT_EVENTS) {
      window.removeEventListener(name, run, listenerOptions);
    }
    callback();
  };
  for (const name of ENGAGEMENT_EVENTS) {
    window.addEventListener(name, run, listenerOptions);
  }
  const arm = () => {
    timer = window.setTimeout(run, fallbackMs);
  };
  if (document.readyState === 'complete') arm();
  else window.addEventListener('load', arm, { once: true });
};
