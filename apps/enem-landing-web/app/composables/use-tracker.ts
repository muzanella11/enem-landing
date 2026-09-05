import type { TrackingSettings } from '@enem-landing/shared-types';
import { useState } from 'nuxt/app';

const VISITOR_ID_KEY = 'elw_visitor_id';
const SESSION_ID_KEY = 'elw_session_id';
const SESSION_LAST_ACTIVITY_KEY = 'elw_session_last_activity';
const SESSION_RECORDING_SAMPLED_KEY = 'elw_session_recording_sampled';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface TrackingSessionResponse {
  id: string;
  recordingSampled: boolean;
}

interface TrackingPageviewResponse {
  id: string;
}

/**
 * Everything a client-side tracker phase (pageview now, events/heatmap/
 * session-recording later) needs: the toggle config (fetched once), the
 * anonymous visitor/session identity, and pageview lifecycle helpers.
 * Backed by Nuxt's `useState` so the plugin and any component share the
 * same reactive instance without prop drilling.
 */
export const useTracker = () => {
  const config = useState<TrackingSettings | null>(
    'tracking-config',
    () => null,
  );
  const visitorId = useState<string | null>('tracking-visitor-id', () => null);
  const sessionId = useState<string | null>('tracking-session-id', () => null);
  const recordingSampled = useState<boolean>(
    'tracking-recording-sampled',
    () => false,
  );
  const currentPageviewId = useState<string | null>(
    'tracking-current-pageview-id',
    () => null,
  );
  const pageEnteredAt = useState<number | null>(
    'tracking-page-entered-at',
    () => null,
  );

  const readStorage = (storage: Storage, key: string): string | null => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStorage = (storage: Storage, key: string, value: string): void => {
    try {
      storage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode, blocked site data, etc.) - the
      // tracker degrades to in-memory-only for this page load, never
      // breaks the page.
    }
  };

  const ensureVisitorId = (): string => {
    if (visitorId.value) return visitorId.value;
    const existing = readStorage(localStorage, VISITOR_ID_KEY);
    const id = existing ?? crypto.randomUUID();
    if (!existing) writeStorage(localStorage, VISITOR_ID_KEY, id);
    visitorId.value = id;
    return id;
  };

  const hasActiveSession = (): boolean => {
    const existingId = readStorage(sessionStorage, SESSION_ID_KEY);
    const lastActivity = Number(
      readStorage(sessionStorage, SESSION_LAST_ACTIVITY_KEY) ?? 0,
    );
    return Boolean(
      existingId && Date.now() - lastActivity < SESSION_TIMEOUT_MS,
    );
  };

  const touchSessionActivity = (): void => {
    writeStorage(sessionStorage, SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
  };

  const startNewSession = async (): Promise<string> => {
    const params = new URLSearchParams(window.location.search);
    const body = {
      visitorId: ensureVisitorId(),
      referrer: document.referrer || undefined,
      utmSource: params.get('utm_source') ?? undefined,
      utmMedium: params.get('utm_medium') ?? undefined,
      utmCampaign: params.get('utm_campaign') ?? undefined,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };

    const session = await $fetch<TrackingSessionResponse>(
      '/api/tracking/session',
      { method: 'post', body },
    );
    writeStorage(sessionStorage, SESSION_ID_KEY, session.id);
    writeStorage(
      sessionStorage,
      SESSION_RECORDING_SAMPLED_KEY,
      String(session.recordingSampled),
    );
    touchSessionActivity();
    sessionId.value = session.id;
    recordingSampled.value = session.recordingSampled;
    return session.id;
  };

  const ensureSessionId = async (): Promise<string> => {
    if (sessionId.value && hasActiveSession()) {
      touchSessionActivity();
      return sessionId.value;
    }
    if (hasActiveSession()) {
      const existing = readStorage(sessionStorage, SESSION_ID_KEY);
      if (existing) {
        sessionId.value = existing;
        recordingSampled.value =
          readStorage(sessionStorage, SESSION_RECORDING_SAMPLED_KEY) === 'true';
        touchSessionActivity();
        return existing;
      }
    }
    return startNewSession();
  };

  const flushPreviousPageviewDuration = (): void => {
    if (!currentPageviewId.value || !pageEnteredAt.value) return;
    const durationMs = Date.now() - pageEnteredAt.value;
    const body = new Blob([JSON.stringify({ durationMs })], {
      type: 'application/json',
    });
    navigator.sendBeacon(
      `/api/tracking/pageview/${currentPageviewId.value}/duration`,
      body,
    );
    currentPageviewId.value = null;
    pageEnteredAt.value = null;
  };

  const init = async (): Promise<void> => {
    try {
      config.value = await $fetch<TrackingSettings>('/api/tracking/config');
    } catch {
      config.value = null;
    }
  };

  const trackPageview = async (path: string): Promise<void> => {
    if (!config.value?.pageviewEnabled) return;

    try {
      flushPreviousPageviewDuration();
      const id = await ensureSessionId();
      const enteredAt = new Date().toISOString();
      const [pageview] = await $fetch<TrackingPageviewResponse[]>(
        '/api/tracking/pageview',
        {
          method: 'post',
          body: { items: [{ sessionId: id, path, enteredAt }] },
        },
      );
      currentPageviewId.value = pageview?.id ?? null;
      pageEnteredAt.value = Date.now();
    } catch {
      // Tracking must never break the page it's tracking.
    }
  };

  const track = async (name: string, payload?: unknown): Promise<void> => {
    if (!config.value?.eventsEnabled) return;

    try {
      const id = await ensureSessionId();
      await $fetch('/api/tracking/events', {
        method: 'post',
        body: {
          items: [
            {
              sessionId: id,
              name,
              payload,
              path: window.location.pathname,
              occurredAt: new Date().toISOString(),
            },
          ],
        },
      });
    } catch {
      // Tracking must never break the page it's tracking.
    }
  };

  const recordClick = async (
    xPct: number,
    yPct: number,
    deviceBucket: 'mobile' | 'tablet' | 'desktop',
  ): Promise<void> => {
    if (!config.value?.heatmapEnabled) return;

    try {
      await $fetch('/api/tracking/clicks', {
        method: 'post',
        body: {
          items: [
            {
              path: window.location.pathname,
              xPct,
              yPct,
              deviceBucket,
              occurredAt: new Date().toISOString(),
            },
          ],
        },
      });
    } catch {
      // Tracking must never break the page it's tracking.
    }
  };

  /**
   * Resolves whether the plugin should start `rrweb.record()` at all for
   * this page load - ensures a session exists first (creating one rolls
   * the server-side sample decision), then reads the verdict.
   */
  const shouldRecordSession = async (): Promise<boolean> => {
    if (!config.value?.sessionRecordingEnabled) return false;
    await ensureSessionId();
    return recordingSampled.value;
  };

  /**
   * Sends one rrweb chunk as plain JSON - `enem-landing-api` gzips it
   * server-side before uploading to R2, so the browser doesn't need the
   * `CompressionStream` API (spottier support) just for this.
   */
  const sendRecordingChunk = async (
    sequence: number,
    events: unknown[],
  ): Promise<void> => {
    if (!config.value?.sessionRecordingEnabled || !recordingSampled.value) {
      return;
    }

    try {
      const id = await ensureSessionId();
      await $fetch('/api/tracking/session-recording', {
        method: 'post',
        body: { sessionId: id, sequence, events },
      });
    } catch {
      // Tracking must never break the page it's tracking.
    }
  };

  return {
    config,
    visitorId,
    sessionId,
    recordingSampled,
    init,
    trackPageview,
    flushPreviousPageviewDuration,
    track,
    recordClick,
    shouldRecordSession,
    sendRecordingChunk,
  };
};
