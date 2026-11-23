import type { UptimeTargetKind } from '@enem-landing/shared-types';
import { accountApiHost, apiHost, logReaderHost } from '../monitor.config.js';

export interface UptimeTarget {
  id: string;
  label: string;
  kind: UptimeTargetKind;
  /** HTTP(S) URL, or `mysql:` / `redis:` for the data stores. */
  url: string;
}

const PROD_SITES = [
  ['web', 'muzanella.com'],
  ['tools', 'tools.muzanella.com'],
  ['cms', 'cms.muzanella.com'],
  ['account', 'account.muzanella.com'],
  ['monitor', 'monitor.muzanella.com'],
] as const;

const DEV_SITES = [
  ['web', 'dev.muzanella.com'],
  ['tools', 'dev-tools.muzanella.com'],
  ['cms', 'dev-cms.muzanella.com'],
  ['account', 'dev-account.muzanella.com'],
  ['monitor', 'dev-monitor.muzanella.com'],
] as const;

/** Public hosts whose TLS certificate is checked. */
export const tlsHosts = (environment: string): string[] =>
  (environment === 'prod'
    ? PROD_SITES
    : environment === 'dev'
      ? DEV_SITES
      : []
  ).map(([, host]) => host);

/**
 * Fixed list, never taken from a request (no SSRF through the monitor).
 * Public sites go through Cloudflare like a visitor; internal APIs over
 * the overlay network; MySQL and Redis are checked by connection.
 */
export const uptimeTargets = (environment: string): UptimeTarget[] => {
  const sites =
    environment === 'prod'
      ? PROD_SITES
      : environment === 'dev'
        ? DEV_SITES
        : [];
  return [
    ...sites.map(([id, host]) => ({
      id: `site-${id}`,
      label: host,
      kind: 'site' as const,
      url: `https://${host}/`,
    })),
    {
      id: 'api-account',
      label: 'enem-landing-account-api',
      kind: 'api',
      url: new URL('/health', accountApiHost()).toString(),
    },
    {
      id: 'api-api',
      label: 'enem-landing-api',
      kind: 'api',
      url: new URL('/health', apiHost()).toString(),
    },
    {
      id: 'api-log-reader',
      label: 'enem-landing-log-reader',
      kind: 'api',
      url: new URL('/health', logReaderHost()).toString(),
    },
    { id: 'db-mysql', label: 'MySQL', kind: 'datastore', url: 'mysql:' },
    { id: 'db-redis', label: 'Redis', kind: 'datastore', url: 'redis:' },
  ];
};
