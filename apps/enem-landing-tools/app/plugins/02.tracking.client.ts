import { sanitizeToolsEventPayload } from '@enem-landing/shared-definitions';
import { installTracker } from '@enem-landing/frontend/tracking';

/**
 * Shared activity tracker for the tools site (Story 25): pageviews,
 * events, and heatmap clicks only. Session recording is off for good -
 * no recorder is passed, so rrweb is never bundled here.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  // Widgets embedded on other sites (Story 49): no tracker, no storage.
  if (window.location.pathname.startsWith('/embed/')) return;
  await installTracker(nuxtApp, {
    site: 'tools',
    recording: false,
    sanitizeEventPayload: sanitizeToolsEventPayload,
    storagePrefix: 'elt',
  });
});
