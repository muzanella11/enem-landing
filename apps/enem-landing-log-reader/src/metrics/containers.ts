import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ContainerMetrics,
  ContainerMetricsList,
} from '@enem-landing/shared-types';
import type { ReaderConfig } from '../config.js';
import { CONTAINER_ID, type ContainerScanner } from '../containers/scanner.js';
import { parseMeminfo, round } from './host.js';

const readText = (path: string): Promise<string | null> =>
  readFile(path, 'utf8').then(
    (text) => text.trim(),
    () => null,
  );

const toNumber = (text: string | null): number | null => {
  if (text === null || text === '' || text === 'max') return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
};

/** `key value` lines (`memory.events`, `cpu.stat`). */
export const parseKeyValues = (text: string | null): Record<string, number> => {
  const values: Record<string, number> = {};
  for (const line of (text ?? '').split('\n')) {
    const [key, value] = line.trim().split(/\s+/);
    if (key && value !== undefined && Number.isFinite(Number(value)))
      values[key] = Number(value);
  }
  return values;
};

/**
 * cgroup v2 directory of a container: `system.slice/docker-<id>.scope` with
 * Docker's systemd cgroup driver (Ubuntu default), `docker/<id>` with the
 * cgroupfs driver. The id comes from the scan, never from the request.
 */
export const cgroupCandidates = (root: string, id: string): string[] => [
  join(root, 'system.slice', `docker-${id}.scope`),
  join(root, 'docker', id),
];

interface CpuState {
  usageUsec: number;
  at: number;
}

/**
 * Memory and CPU of every running container, read from the host's cgroup
 * v2 tree (mounted read-only). Matches `docker stats --no-stream`:
 * memory is `memory.current`, CPU is the `usage_usec` delta since the
 * previous call divided by wall time (100% = one core).
 */
export class ContainerMetricsReader {
  private readonly cpu = new Map<string, CpuState>();

  constructor(
    private readonly config: ReaderConfig,
    private readonly scanner: ContainerScanner,
  ) {}

  private async dirOf(id: string): Promise<string | null> {
    for (const dir of cgroupCandidates(this.config.cgroupDir, id)) {
      if ((await readText(join(dir, 'memory.current'))) !== null) return dir;
    }
    return null;
  }

  private async cpuUsage(id: string, dir: string): Promise<number | null> {
    const stat = parseKeyValues(await readText(join(dir, 'cpu.stat')));
    const usage = stat['usage_usec'];
    if (usage === undefined) return null;
    const now = Date.now();
    const previous = this.cpu.get(id);
    this.cpu.set(id, { usageUsec: usage, at: now });
    if (!previous || now - previous.at < 500) return null;
    const elapsedUsec = (now - previous.at) * 1000;
    return round(((usage - previous.usageUsec) / elapsedUsec) * 100);
  }

  async read(): Promise<ContainerMetricsList> {
    const containers = (await this.scanner.all()).filter(
      (container) => container.running && CONTAINER_ID.test(container.id),
    );
    const metrics: ContainerMetrics[] = [];
    const seen = new Set<string>();
    for (const container of containers) {
      seen.add(container.id);
      const dir = await this.dirOf(container.id);
      const current = dir
        ? toNumber(await readText(join(dir, 'memory.current')))
        : null;
      const max = dir
        ? toNumber(await readText(join(dir, 'memory.max')))
        : null;
      const peak = dir
        ? toNumber(await readText(join(dir, 'memory.peak')))
        : null;
      const events = dir
        ? parseKeyValues(await readText(join(dir, 'memory.events')))
        : {};
      metrics.push({
        id: container.id,
        name: container.name,
        service: container.service,
        stack: container.stack,
        category: container.category,
        memoryCurrent: current,
        memoryMax: max,
        memoryPeak: peak,
        memoryPercent:
          current !== null && max ? round((current / max) * 100) : null,
        oomKills: dir ? (events['oom_kill'] ?? 0) : null,
        cpuPercent: dir ? await this.cpuUsage(container.id, dir) : null,
      });
    }
    for (const id of this.cpu.keys()) if (!seen.has(id)) this.cpu.delete(id);

    const meminfo = parseMeminfo(
      (await readText(join(this.config.procDir, 'meminfo'))) ?? '',
    );
    metrics.sort((a, b) => (b.memoryPercent ?? -1) - (a.memoryPercent ?? -1));
    return {
      time: new Date().toISOString(),
      containers: metrics,
      totalLimits: metrics.reduce((sum, m) => sum + (m.memoryMax ?? 0), 0),
      hostMemory: meminfo['MemTotal'] ?? 0,
    };
  }
}
