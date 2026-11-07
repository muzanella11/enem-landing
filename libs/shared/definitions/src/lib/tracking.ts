/**
 * Sites whose activity is tracked by enem-landing-api (Story 25). Every
 * tracking row is tagged with one of these so the CMS can report on each
 * site separately. `landing` is the default everywhere, so callers that
 * predate multi-site tracking keep working unchanged.
 */
export const TRACKING_SITES = ['landing', 'tools'] as const;

export type TrackingSite = (typeof TRACKING_SITES)[number];

export const DEFAULT_TRACKING_SITE: TrackingSite = 'landing';

/**
 * Sites where session recording can never be turned on. rrweb captures
 * input values and rendered results from the DOM, and the tools hub
 * promises users that salary figures, zakat amounts, and invoice contents
 * never leave their device (Story 20-25).
 */
export const RECORDING_DISABLED_SITES: readonly TrackingSite[] = ['tools'];

export const isRecordingAllowedForSite = (site: TrackingSite): boolean =>
  !RECORDING_DISABLED_SITES.includes(site);

/**
 * Event payload keys accepted from the tools site. Anything else is
 * dropped, both client-side and again in enem-landing-api, so a careless
 * `track()` call can't leak a user's input.
 */
export const TOOLS_EVENT_PAYLOAD_KEYS = [
  'toolId',
  'action',
  'step',
  'placement',
  'mode',
  'donationOptionId',
] as const;

export const TOOLS_EVENT_PAYLOAD_MAX_LENGTH = 64;

/**
 * Keeps only whitelisted keys with short string values. Numbers, objects,
 * and anything else are dropped rather than coerced, because a stringified
 * number is exactly the kind of value (a salary, a nominal) that must not
 * be stored. Returns `null` when nothing survives.
 */
export const sanitizeToolsEventPayload = (
  payload: unknown,
): Record<string, string> | null => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const allowed = TOOLS_EVENT_PAYLOAD_KEYS as readonly string[];
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!allowed.includes(key) || typeof value !== 'string') continue;
    const trimmed = value.trim().slice(0, TOOLS_EVENT_PAYLOAD_MAX_LENGTH);
    if (!trimmed || /^[\d.,\s]+$/.test(trimmed)) continue;
    result[key] = trimmed;
  }
  return Object.keys(result).length > 0 ? result : null;
};
