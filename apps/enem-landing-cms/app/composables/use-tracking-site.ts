import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type TrackingSiteValue = 'landing' | 'tools';

export const TRACKING_SITE_OPTIONS: {
  value: TrackingSiteValue;
  title: string;
  host: string;
}[] = [
  { value: 'landing', title: 'muzanella.com', host: 'webHost' },
  { value: 'tools', title: 'tools.muzanella.com', host: 'toolsHost' },
];

/**
 * Which site the Activity Tracking pages show (Story 25). Kept in the
 * `?site=` query so a view can be bookmarked or shared; `landing` is the
 * default and is left out of the URL.
 */
export const useTrackingSite = () => {
  const route = useRoute();
  const router = useRouter();
  const config = useRuntimeConfig();

  const site = computed<TrackingSiteValue>({
    get: () => (route.query['site'] === 'tools' ? 'tools' : 'landing'),
    set: (value) => {
      void router.replace({
        query: {
          ...route.query,
          site: value === 'landing' ? undefined : value,
        },
      });
    },
  });

  const isTools = computed(() => site.value === 'tools');
  const siteQuery = computed(() => ({ site: site.value }));
  const withSite = (path: string) =>
    site.value === 'landing' ? path : `${path}?site=${site.value}`;
  const publicHost = computed(() =>
    isTools.value
      ? (config.public['toolsHost'] as string)
      : (config.public['webHost'] as string),
  );
  const siteLabel = computed(
    () =>
      TRACKING_SITE_OPTIONS.find((option) => option.value === site.value)
        ?.title ?? '',
  );

  return { site, isTools, siteQuery, withSite, publicHost, siteLabel };
};
