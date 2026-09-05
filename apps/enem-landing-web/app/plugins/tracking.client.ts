import { useTracker } from '../composables/use-tracker.js';

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;
const RECORDING_FLUSH_INTERVAL_MS = 10_000;

const getDeviceBucket = (): 'mobile' | 'tablet' | 'desktop' => {
  if (window.innerWidth < MOBILE_MAX_WIDTH) return 'mobile';
  if (window.innerWidth < TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
};

/**
 * Client-only (needs `window`/localStorage/sessionStorage) - boots the
 * activity tracker once per app load, then records a pageview on every
 * route change. Each capability (pageview now, events/heatmap/session
 * recording in later stories) is gated on its own toggle inside
 * `useTracker()`, fetched once from `/api/tracking/config` here.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  const tracker = useTracker();
  await tracker.init();

  // `page:finish` fires after every route transition, including the
  // initial page load - a separate manual call here would double-record
  // the first pageview.
  nuxtApp.hook('page:finish', () => {
    tracker.trackPageview(useRoute().fullPath);
  });

  // Auto-binding: any element with `data-track="event_name"` sends that
  // event on click, no manual wiring per component. Delegated at the
  // document level (rather than per-element listeners) so it works for
  // elements rendered after this plugin runs too.
  document.addEventListener('click', (clickEvent) => {
    const target = clickEvent.target as HTMLElement | null;
    const trackedEl = target?.closest<HTMLElement>('[data-track]');
    const eventName = trackedEl?.dataset['track'];
    if (eventName) {
      tracker.track(eventName);
    }
  });

  // Heatmap: every click, normalized to the full rendered page (not the
  // viewport) so the same coordinate means the same spot on the page
  // regardless of scroll position or window size.
  document.addEventListener('click', (clickEvent) => {
    const pageWidth = document.documentElement.scrollWidth;
    const pageHeight = document.documentElement.scrollHeight;
    if (pageWidth <= 0 || pageHeight <= 0) return;

    tracker.recordClick(
      clickEvent.pageX / pageWidth,
      clickEvent.pageY / pageHeight,
      getDeviceBucket(),
    );
  });

  // Session recording: only start rrweb at all if this session already
  // won its server-side sampling roll - most sessions never even import
  // the library.
  if (await tracker.shouldRecordSession()) {
    const { record } = await import('rrweb');
    let sequence = 0;
    let buffer: unknown[] = [];

    const flush = () => {
      if (buffer.length === 0) return;
      const events = buffer;
      buffer = [];
      tracker.sendRecordingChunk(sequence, events);
      sequence += 1;
    };

    record({
      emit: (event) => {
        buffer.push(event);
      },
    });

    const flushInterval = setInterval(flush, RECORDING_FLUSH_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('beforeunload', () => {
      clearInterval(flushInterval);
      flush();
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      tracker.flushPreviousPageviewDuration();
    }
  });

  window.addEventListener('beforeunload', () => {
    tracker.flushPreviousPageviewDuration();
  });
});
