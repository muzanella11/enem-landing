import type {
  ContainerInfo,
  ContainerList,
  DeployHistoryEntry,
  DeployOverview,
  DeployRow,
  DeployServiceVersion,
} from '@enem-landing/shared-types';
import { Injectable } from '@nestjs/common';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { MonitorStore } from '../store/monitor-store.js';

const HISTORY_MAX = 200;
const HISTORY_TTL_SECONDS = 90 * 86_400;
const GITHUB_REPO = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;
const SHA = /^[0-9a-f]{7,40}$/;

const envOf = (stack: string): 'prod' | 'dev' | null =>
  stack === 'enem-landing'
    ? 'prod'
    : stack === 'enem-landing-dev'
      ? 'dev'
      : null;

export const shortService = (
  container: Pick<ContainerInfo, 'service' | 'stack'>,
): string =>
  container.service.startsWith(`${container.stack}_`)
    ? container.service.slice(container.stack.length + 1)
    : container.service;

/** Version from the OCI label, or the image tag when the label is missing. */
const versionOf = (container: ContainerInfo): string | null =>
  container.version ??
  (container.image.includes(':')
    ? (container.image.split(':').pop() ?? null)
    : null);

const toVersion = (
  container: ContainerInfo,
  environment: 'prod' | 'dev',
): DeployServiceVersion => ({
  service: shortService(container),
  environment,
  containerId: container.id,
  image: container.image,
  version: versionOf(container),
  revision: container.revision,
  source: container.source,
  deployedAt: container.createdAt ?? container.startedAt,
  imageCreated: container.imageCreated,
});

/** Links are built from the image's own `source` label, never from input. */
export const compareUrl = (
  prod: DeployServiceVersion | null,
  dev: DeployServiceVersion | null,
): string | null => {
  const source = prod?.source ?? dev?.source;
  if (!source || !GITHUB_REPO.test(source)) return null;
  if (
    !prod?.revision ||
    !dev?.revision ||
    !SHA.test(prod.revision) ||
    !SHA.test(dev.revision)
  )
    return null;
  return `${source}/compare/${prod.revision}...${dev.revision}`;
};

const semver = (version: string | null): number[] | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version ?? '');
  return match ? match.slice(1).map(Number) : null;
};

/** Older image (by build time, else semver) replacing a newer one. */
export const isRollback = (
  previous: { version: string | null; imageCreated?: string | null },
  next: { version: string | null; imageCreated?: string | null },
): boolean => {
  if (previous.imageCreated && next.imageCreated)
    return Date.parse(next.imageCreated) < Date.parse(previous.imageCreated);
  const a = semver(previous.version);
  const b = semver(next.version);
  if (!a || !b) return false;
  for (let index = 0; index < 3; index += 1) {
    if (b[index] !== a[index]) return b[index] < a[index];
  }
  return false;
};

/**
 * Running versions per service and environment, read from the
 * containers' OCI labels (no registry or GitHub API calls). The primary
 * monitor records every version change in a shared Redis list (200
 * entries, 90 days), so history outlives the 72 h of stopped containers.
 */
@Injectable()
export class DeployService {
  constructor(
    private readonly reader: LogReaderClient,
    private readonly store: MonitorStore,
  ) {}

  rows(list: ContainerList): DeployRow[] {
    const byService = new Map<string, DeployRow>();
    for (const container of list.running) {
      const environment = envOf(container.stack);
      if (!environment) continue;
      const version = toVersion(container, environment);
      const row = byService.get(version.service) ?? {
        service: version.service,
        prod: null,
        dev: null,
        differs: false,
        compareUrl: null,
      };
      // Several replicas: keep the newest container.
      const current = row[environment];
      if (!current || (version.deployedAt ?? '') > (current.deployedAt ?? ''))
        row[environment] = version;
      byService.set(version.service, row);
    }
    return [...byService.values()]
      .map((row) => {
        const differs =
          row.prod !== null &&
          row.dev !== null &&
          (row.prod.revision ?? row.prod.image) !==
            (row.dev.revision ?? row.dev.image);
        return {
          ...row,
          differs,
          compareUrl: differs ? compareUrl(row.prod, row.dev) : null,
        };
      })
      .sort((a, b) => a.service.localeCompare(b.service));
  }

  /** Compares the running versions with the last recorded ones. */
  async record(list: ContainerList): Promise<DeployHistoryEntry[]> {
    const currentKey = this.store.shared('deploy-current');
    const known = await this.store.hashJson<DeployServiceVersion>(currentKey);
    const added: DeployHistoryEntry[] = [];
    for (const row of this.rows(list)) {
      for (const version of [row.prod, row.dev]) {
        if (!version) continue;
        const field = `${version.service}@${version.environment}`;
        const previous = known[field];
        if (previous?.containerId === version.containerId) continue;
        await this.store.client.hset(
          currentKey,
          field,
          JSON.stringify(version),
        );
        if (!previous) continue; // First sighting: baseline, not a deploy.
        if (
          (previous.revision ?? previous.image) ===
            (version.revision ?? version.image) &&
          previous.version === version.version
        )
          continue; // Same image, new task (restart or crash).
        const entry: DeployHistoryEntry = {
          time: version.deployedAt ?? new Date().toISOString(),
          service: version.service,
          environment: version.environment,
          version: version.version,
          revision: version.revision,
          previousVersion: previous.version,
          previousRevision: previous.revision,
          source: version.source,
          rollback: isRollback(previous, version),
        };
        await this.store.pushCapped(
          this.store.shared('deploy-history'),
          entry,
          HISTORY_MAX,
          HISTORY_TTL_SECONDS,
        );
        added.push(entry);
      }
    }
    await this.store.client.expire(currentKey, HISTORY_TTL_SECONDS);
    return added;
  }

  async overview(): Promise<DeployOverview> {
    const list = await this.reader.get<ContainerList>('/containers');
    const rows = this.rows(list);
    const history = await this.store.listJson<DeployHistoryEntry>(
      this.store.shared('deploy-history'),
      HISTORY_MAX,
    );
    const latest = (environment: 'prod' | 'dev') =>
      rows
        .map((row) => row[environment]?.deployedAt ?? null)
        .filter((value): value is string => value !== null)
        .sort()
        .pop() ?? null;
    const prodVersions = rows
      .map((row) => row.prod?.version)
      .filter(
        (value): value is string =>
          Boolean(value) && /^v?\d+\.\d+\.\d+/.test(value as string),
      );
    return {
      rows,
      history,
      lastDeploy: { prod: latest('prod'), dev: latest('dev') },
      prodVersion:
        prodVersions.sort().pop() ??
        rows.find((row) => row.prod?.version)?.prod?.version ??
        null,
      differingServices: rows.filter((row) => row.differs).length,
    };
  }
}
