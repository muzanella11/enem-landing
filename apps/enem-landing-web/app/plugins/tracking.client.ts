import { installTracker } from '@enem-landing/frontend/tracking';

/**
 * Client-only - boots the shared activity tracker (libs/frontend, Story
 * 25) for the landing site. Session recording stays available here; rrweb
 * is only imported when a session actually wins its sampling roll.
 */
export default defineNuxtPlugin(async (nuxtApp) => {
  await installTracker(nuxtApp, {
    site: 'landing',
    recording: true,
    loadRecorder: () => import('rrweb'),
  });
});
