import { whenEngaged } from '@enem-landing/frontend/tracking';

const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
const BEACON_TOKEN = '226b9613dc144a14820f52e77817faea';

/**
 * Cloudflare Web Analytics. Used to sit in <head>, where its script and
 * RUM calls competed with the page's own first requests (PageSpeed); it
 * now loads on the visitor's first interaction (or 8s after load), the
 * same rule as GA.
 */
export default defineNuxtPlugin(() => {
  whenEngaged(() => {
    if (document.querySelector(`script[src="${BEACON_SRC}"]`)) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = BEACON_SRC;
    script.dataset['cfBeacon'] = JSON.stringify({ token: BEACON_TOKEN });
    document.head.appendChild(script);
  });
});
