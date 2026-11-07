import type { TrackingSite } from '@enem-landing/shared-definitions';
import type { TrackingSettings } from '@enem-landing/shared-types';
import { useState } from 'nuxt/app';

/** Nuxt ambient global - see `use-whoami.ts` for why it's declared here. */
declare const $fetch: typeof import('ofetch').$fetch;

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export interface TrackerOptions {
  /** Which site this app is - sent with every session/config/click request (Story 25). */
  site: TrackingSite;
  /**
   * Whether this app may ever record sessions. `false` for the tools hub:
   * the tracker then never asks to record and never sends a chunk, no
   * matter what the server config says.
   */
  recording: boolean;
  /**
   * Runs on every event payload before it leaves the browser. The tools
   * hub passes `sanitizeToolsEventPayload` so only whitelisted keys go out.
   */
  sanitizeEventPayload?: (payload: unknown) => unknown;
  /**
   * Storage key prefix. Each app keeps its own visitor/session ids, since
   * they live on different origins anyway. Defaults to `elw` (the original
   * enem-landing-web keys, so existing visitors keep their ids).
   */
  storagePrefix?: string;
}

let options: TrackerOptions = { site: 'landing', recording: true };

/** Called once by the consuming app's tracking plugin, before `init()`. */
export const configureTracker = (next: TrackerOptions): void => {
  options = next;
};

export const getTrackerOptions = (): TrackerOptions => options;

interface TrackingSessionResponse {
  id: string;
  recordingSampled: boolean;
}

interface TrackingPageviewResponse {
  id: string;
}

const storageKeys = () => {
  const prefix = options.storagePrefix ?? 'elw';
  return {
    visitorId: `${prefix}_visitor_id`,
    sessionId: `${prefix}_session_id`,
    lastActivity: `${prefix}_session_last_activity`,
    recordingSampled: `${prefix}_session_recording_sampled`,
  };
};

/**
 * Everything a client-side tracker phase needs: the toggle config
 * (fetched once), the anonymous visitor/session identity, and pageview/
 * event/click/recording helpers. Backed by Nuxt's `useState` so the
 * plugin and any component share the same reactive instance.
 *
 * Moved from enem-landing-web into this lib in Story 25 so
 * enem-landing-tools can use the same tracker with its own site and
 * privacy options (see `TrackerOptions`).
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
    const keys = storageKeys();
    const existing = readStorage(localStorage, keys.visitorId);
    const id = existing ?? crypto.randomUUID();
    if (!existing) writeStorage(localStorage, keys.visitorId, id);
    visitorId.value = id;
    return id;
  };

  const hasActiveSession = (): boolean => {
    const keys = storageKeys();
    const existingId = readStorage(sessionStorage, keys.sessionId);
    const lastActivity = Number(
      readStorage(sessionStorage, keys.lastActivity) ?? 0,
    );
    return Boolean(
      existingId && Date.now() - lastActivity < SESSION_TIMEOUT_MS,
    );
  };

  const touchSessionActivity = (): void => {
    writeStorage(
      sessionStorage,
      storageKeys().lastActivity,
      String(Date.now()),
    );
  };

  const startNewSession = async (): Promise<string> => {
    const params = new URLSearchParams(window.location.search);
    const body = {
      site: options.site,
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
    const keys = storageKeys();
    writeStorage(sessionStorage, keys.sessionId, session.id);
    const sampled = options.recording && session.recordingSampled;
    writeStorage(sessionStorage, keys.recordingSampled, String(sampled));
    touchSessionActivity();
    sessionId.value = session.id;
    recordingSampled.value = sampled;
    return session.id;
  };

  const ensureSessionId = async (): Promise<string> => {
    if (sessionId.value && hasActiveSession()) {
      touchSessionActivity();
      return sessionId.value;
    }
    if (hasActiveSession()) {
      const keys = storageKeys();
      const existing = readStorage(sessionStorage, keys.sessionId);
      if (existing) {
        sessionId.value = existing;
        recordingSampled.value =
          options.recording &&
          readStorage(sessionStorage, keys.recordingSampled) === 'true';
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
      const fetched = await $fetch<TrackingSettings>('/api/tracking/config', {
        query: { site: options.site },
      });
      config.value = options.recording
        ? fetched
        : { ...fetched, sessionRecordingEnabled: false };
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
      const safePayload = options.sanitizeEventPayload
        ? options.sanitizeEventPayload(payload)
        : payload;
      await $fetch('/api/tracking/events', {
        method: 'post',
        body: {
          items: [
            {
              sessionId: id,
              name,
              payload: safePayload ?? undefined,
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
          site: options.site,
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
   * Resolves whether the plugin should start recording at all for this
   * page load. Always `false` when the app opted out of recording.
   */
  const shouldRecordSession = async (): Promise<boolean> => {
    if (!options.recording) return false;
    if (!config.value?.sessionRecordingEnabled) return false;
    await ensureSessionId();
    return recordingSampled.value;
  };

  /**
   * Sends one rrweb chunk as plain JSON - `enem-landing-api` gzips it
   * server-side before uploading to R2.
   */
  const sendRecordingChunk = async (
    sequence: number,
    events: unknown[],
  ): Promise<void> => {
    if (
      !options.recording ||
      !config.value?.sessionRecordingEnabled ||
      !recordingSampled.value
    ) {
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
