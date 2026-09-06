/**
 * Single-row config, not a list — there is exactly one tracking settings
 * row per deployment (see Story 13, `GET`/`PUT /tracking/settings`).
 *
 * `sessionRecordingSampleRatePct` is also returned by the public
 * `GET /tracking/config`, not just the admin-only settings endpoint -
 * the sampling roll itself happens server-side at `createSession` (see
 * `TrackingSessionEntity.recordingSampled`, Story 16), so the client
 * doesn't actually need the rate to make that decision. It's exposed
 * anyway because it isn't sensitive (unlike a real secret) and keeping
 * one shared shape for both endpoints is simpler than a second, narrower
 * "public config" type for a single non-sensitive number.
 */
export interface TrackingSettings {
  pageviewEnabled: boolean;
  eventsEnabled: boolean;
  heatmapEnabled: boolean;
  sessionRecordingEnabled: boolean;
  sessionRecordingSampleRatePct: number;
}

export interface TrackingLocation {
  country: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  count: number;
}

export interface TrackingOverview {
  pageviewsToday: number;
  activeSessions: number;
  totalVisitors: number;
  topCountry: string | null;
  pageviewsByDay: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  devices: { device: string; count: number }[];
  locations: TrackingLocation[];
}

/**
 * Each step matches either a pageview `path` or an event `name` (see
 * Story 14, `TrackingFunnelsService.getReport`) - no separate step-type
 * field, keeping the definition a plain ordered string list.
 */
export interface TrackingFunnel {
  id: string;
  name: string;
  steps: string[];
}

export interface TrackingFunnelReportStep {
  step: string;
  count: number;
}

export interface TrackingRecordingSession {
  id: string;
  deviceType: string | null;
  browserName: string | null;
  startedAt: string;
  pageviewCount: number;
  paths: string[];
}

export interface TrackingRecordingChunkMeta {
  sequence: number;
  url: string;
}

/** Full `tracking_sessions` row - backs the CMS's visitor IP/geolocation detail list (Visitor Locations > Detail). */
export interface TrackingVisitor {
  id: string;
  visitorId: string;
  startedAt: string;
  endedAt: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceType: string | null;
  deviceVendor: string | null;
  deviceModel: string | null;
  browserName: string | null;
  browserVersion: string | null;
  engineName: string | null;
  engineVersion: string | null;
  osName: string | null;
  osVersion: string | null;
  cpuArchitecture: string | null;
  language: string | null;
  timezone: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  recordingSampled: boolean;
}
