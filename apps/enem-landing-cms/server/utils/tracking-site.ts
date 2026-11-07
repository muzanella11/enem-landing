import type { H3Event } from 'h3';

const SITES = ['landing', 'tools'] as const;

/**
 * `?site=` from the CMS page, validated and forwarded to enem-landing-api
 * (Story 25). Anything unknown falls back to `landing`.
 */
export const getTrackingSite = (event: H3Event): (typeof SITES)[number] => {
  const site = getQuery(event)['site'];
  return SITES.includes(site as (typeof SITES)[number])
    ? (site as (typeof SITES)[number])
    : 'landing';
};
