import { lstat, open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ContainerCategory,
  ContainerInfo,
  ContainerList,
} from '@enem-landing/shared-types';
import { type ResolvedFile, toPublicFile } from '../sources/catalog.js';
import { isPlainName } from '../paths.js';

export const CONTAINER_ID = /^[a-f0-9]{64}$/;

const ZERO_TIME = '0001-01-01T00:00:00Z';
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CONFIG_BYTES = 2 * 1024 * 1024;

interface DockerConfig {
  Name?: string;
  RestartCount?: number;
  State?: {
    Running?: boolean;
    StartedAt?: string;
    FinishedAt?: string;
    ExitCode?: number;
    OOMKilled?: boolean;
    Error?: string;
  };
  Config?: { Labels?: Record<string, string> };
}

export interface ScannedContainer extends ContainerInfo {
  logFiles: ResolvedFile[];
}

/** Stack -> menu. Unknown stacks go to Server/Infra so nothing is hidden. */
export const categoryOf = (stack: string): ContainerCategory => {
  switch (stack) {
    case 'enem-landing':
      return 'apps-prod';
    case 'enem-landing-dev':
      return 'apps-dev';
    case 'redis':
      return 'redis';
    case 'mysql':
      return 'db';
    default:
      return 'infra';
  }
};

const time = (value: string | undefined): string | null =>
  !value || value.startsWith(ZERO_TIME.slice(0, 4)) ? null : value;

/**
 * 0 is a normal stop, 143 is SIGTERM (Swarm stopping a task on deploy).
 * Anything else (1 app error, 137 SIGKILL, 139 segfault) or an OOM kill is
 * a crash.
 */
export const isCrash = (
  running: boolean,
  exitCode: number | null,
  oomKilled: boolean,
): boolean =>
  !running &&
  (oomKilled || (exitCode !== null && exitCode !== 0 && exitCode !== 143));

const readJson = async (path: string): Promise<DockerConfig | null> => {
  try {
    const handle = await open(path, 'r');
    try {
      const { size } = await handle.stat();
      if (size > MAX_CONFIG_BYTES) return null;
      const buffer = Buffer.alloc(size);
      await handle.read(buffer, 0, size, 0);
      return JSON.parse(buffer.toString('utf8')) as DockerConfig;
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
};

const logFilesOf = async (
  root: string,
  id: string,
): Promise<ResolvedFile[]> => {
  const dir = join(root, id);
  const pattern = new RegExp(`^${id}-json\\.log(\\.(\\d+))?(\\.gz)?$`);
  let names: string[];
  try {
    names = (await readdir(dir)).filter(
      (name) => isPlainName(name) && pattern.test(name),
    );
  } catch {
    return [];
  }
  const rotation = (name: string) => Number(pattern.exec(name)?.[2] ?? -1);
  names.sort((a, b) => rotation(a) - rotation(b));
  const files: ResolvedFile[] = [];
  for (const name of names) {
    try {
      const stats = await lstat(join(dir, name));
      if (!stats.isFile()) continue;
      files.push({
        index: files.length,
        name,
        path: join(dir, name),
        root,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        compressed: name.endsWith('.gz'),
        supported: true,
      });
    } catch {
      // File rotated away between readdir and lstat.
    }
  }
  return files;
};

export const parseContainer = (
  id: string,
  config: DockerConfig,
  logFiles: ResolvedFile[],
): ScannedContainer => {
  const labels = config.Config?.Labels ?? {};
  const name = (config.Name ?? id).replace(/^\//, '');
  const stack = labels['com.docker.stack.namespace'] ?? '';
  const running = Boolean(config.State?.Running);
  const exitCode = running ? null : (config.State?.ExitCode ?? null);
  const oomKilled = Boolean(config.State?.OOMKilled);
  return {
    id,
    name,
    service: labels['com.docker.swarm.service.name'] ?? name,
    stack,
    category: categoryOf(stack),
    running,
    startedAt: time(config.State?.StartedAt),
    finishedAt: running ? null : time(config.State?.FinishedAt),
    exitCode,
    oomKilled,
    error: config.State?.Error ?? '',
    restartCount: config.RestartCount ?? 0,
    crashed: isCrash(running, exitCode, oomKilled),
    recentCrash: false,
    files: logFiles.map(toPublicFile),
    logFiles,
  };
};

/** Adds per-service history (restarts, recent crash badge) and sorts. */
export const summarize = (
  containers: ScannedContainer[],
  now: number,
): { running: ScannedContainer[]; stopped: ScannedContainer[] } => {
  const running = containers.filter((container) => container.running);
  const stopped = containers.filter((container) => !container.running);
  for (const container of running) {
    const history = stopped.filter(
      (other) =>
        other.service === container.service && other.stack === container.stack,
    );
    container.restartCount += history.length;
    container.recentCrash = history.some(
      (other) =>
        other.crashed &&
        other.finishedAt !== null &&
        now - Date.parse(other.finishedAt) < DAY_MS,
    );
  }
  running.sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.service.localeCompare(b.service) ||
      a.name.localeCompare(b.name),
  );
  stopped.sort(
    (a, b) =>
      Date.parse(b.finishedAt ?? '') - Date.parse(a.finishedAt ?? '') ||
      a.name.localeCompare(b.name),
  );
  return { running, stopped };
};

/**
 * Finds containers by reading `config.v2.json` under the read-only mount
 * of `/var/lib/docker/containers`, so the reader never needs the Docker
 * socket. Results are cached briefly.
 */
export class ContainerScanner {
  private cache: {
    at: number;
    running: ScannedContainer[];
    stopped: ScannedContainer[];
  } | null = null;

  constructor(
    private readonly root: string,
    private readonly ttlMs = 10_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  private async scan() {
    if (this.cache && this.now() - this.cache.at < this.ttlMs)
      return this.cache;
    let ids: string[] = [];
    try {
      ids = (await readdir(this.root)).filter((name) =>
        CONTAINER_ID.test(name),
      );
    } catch {
      ids = [];
    }
    const containers: ScannedContainer[] = [];
    for (const id of ids) {
      const config = await readJson(join(this.root, id, 'config.v2.json'));
      if (!config) continue;
      containers.push(
        parseContainer(id, config, await logFilesOf(this.root, id)),
      );
    }
    this.cache = { at: this.now(), ...summarize(containers, this.now()) };
    return this.cache;
  }

  async list(): Promise<ContainerList> {
    const { at, running, stopped } = await this.scan();
    const strip = (container: ScannedContainer): ContainerInfo => {
      const info: Partial<ScannedContainer> = { ...container };
      delete info.logFiles;
      return info as ContainerInfo;
    };
    return {
      running: running.map(strip),
      stopped: stopped.map(strip),
      scannedAt: new Date(at).toISOString(),
    };
  }

  /** Only ids found by the scan are readable; the id is never used as a raw path. */
  async find(id: string): Promise<ScannedContainer | null> {
    if (!CONTAINER_ID.test(id)) return null;
    const { running, stopped } = await this.scan();
    return (
      [...running, ...stopped].find((container) => container.id === id) ?? null
    );
  }
}
