import type { NuxtApp } from 'nuxt/app';
import {
  configureTracker,
  useTracker,
  type TrackerOptions,
} from './use-tracker.js';
import { readTrackPayload } from './track-payload.js';

const MOBILE_MAX_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;
const RECORDING_FLUSH_INTERVAL_MS = 10_000;

/** Minimal shape of rrweb's `record` - kept local so this lib never depends on rrweb. */
type RecordFn = (options: {
  emit: (event: unknown) => void;
  maskAllInputs?: boolean;
}) => unknown;

export interface InstallTrackerOptions extends TrackerOptions {
  /**
   * Lazily loads the session recorder. Only apps that allow recording pass
   * this (enem-landing-web passes `() => import('rrweb')`), so rrweb never
   * ends up in the tools hub's bundle.
   */
  loadRecorder?: () => Promise<{ record: RecordFn }>;
}

const getDeviceBucket = (): 'mobile' | 'tablet' | 'desktop' => {
  if (window.innerWidth < MOBILE_MAX_WIDTH) return 'mobile';
  if (window.innerWidth < TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
};

/**
 * Client-only - boots the activity tracker once per app load and wires
 * pageviews, `data-track` events, heatmap clicks, and (when allowed)
 * session recording. Call from the app's own `*.client.ts` plugin.
 */
export const installTracker = async (
  nuxtApp: NuxtApp,
  installOptions: InstallTrackerOptions,
): Promise<void> => {
  const { loadRecorder, ...trackerOptions } = installOptions;
  configureTracker(trackerOptions);

  const tracker = useTracker();
  await tracker.init();

  // `page:finish` fires after every route transition, including the
  // initial page load.
  nuxtApp.hook('page:finish', () => {
    const route = nuxtApp.$router as
      { currentRoute: { value: { fullPath: string } } } | undefined;
    const fullPath = route?.currentRoute.value.fullPath ?? location.pathname;
    // Never send the fragment: the tools hub carries shared calculator
    // state there (Story 20), and it has no analytics value anyway.
    tracker.trackPageview(fullPath.split('#')[0] || '/');
  });

  document.addEventListener('click', (clickEvent) => {
    const target = clickEvent.target as HTMLElement | null;
    const trackedEl = target?.closest<HTMLElement>('[data-track]');
    const eventName = trackedEl?.dataset['track'];
    if (trackedEl && eventName) {
      tracker.track(eventName, readTrackPayload(trackedEl));
    }
  });

  // Heatmap: every click, normalized to the full rendered page (not the
  // viewport). Only coordinates leave the browser, never element text.
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

  if (
    trackerOptions.recording &&
    loadRecorder &&
    (await tracker.shouldRecordSession())
  ) {
    const { record } = await loadRecorder();
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
      // Story 56: what visitors type (contact form) is never recorded;
      // the privacy page promises this.
      maskAllInputs: true,
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
};
