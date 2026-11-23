import { readFile, statfs } from 'node:fs/promises';
import { join } from 'node:path';
import type { DiskUsage, HostMetrics } from '@enem-landing/shared-types';
import type { ReaderConfig } from '../config.js';

export interface CpuSample {
  busy: number;
  total: number;
  at: number;
}

/** First line of `/proc/stat`: `cpu user nice system idle iowait irq softirq steal ...` (jiffies). */
export const parseCpuLine = (stat: string): CpuSample | null => {
  const line = stat.split('\n').find((row) => row.startsWith('cpu '));
  if (!line) return null;
  const values = line.trim().split(/\s+/).slice(1, 9).map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;
  const total = values.reduce((sum, value) => sum + value, 0);
  const idle = (values[3] ?? 0) + (values[4] ?? 0);
  return { busy: total - idle, total, at: Date.now() };
};

export const countCpus = (stat: string): number =>
  Math.max(1, stat.split('\n').filter((row) => /^cpu\d+\s/.test(row)).length);

export const cpuPercentBetween = (
  previous: CpuSample,
  current: CpuSample,
): number | null => {
  const total = current.total - previous.total;
  if (total <= 0) return null;
  return round(((current.busy - previous.busy) / total) * 100);
};

/** `/proc/meminfo` values in bytes (the file uses kB). */
export const parseMeminfo = (text: string): Record<string, number> => {
  const values: Record<string, number> = {};
  for (const line of text.split('\n')) {
    const match = /^(\w+):\s+(\d+)(\s+kB)?/.exec(line);
    if (match) values[match[1]] = Number(match[2]) * (match[3] ? 1024 : 1);
  }
  return values;
};

export const round = (value: number, digits = 1): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const percent = (part: number, whole: number): number =>
  whole > 0 ? round((part / whole) * 100) : 0;

/** Same numbers as `df`: used / (used + available to non-root). */
export const diskUsage = async (
  mount: string,
  label: string,
): Promise<DiskUsage | null> => {
  try {
    const stats = await statfs(mount);
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const used = (stats.blocks - stats.bfree) * stats.bsize;
    return {
      mount: label,
      label,
      total,
      used,
      free,
      percent: percent(used, used + free),
    };
  } catch {
    return null;
  }
};

/**
 * Host gauges from `/proc` (no lxcfs in the container, so these are the
 * host's numbers) and `statfs` on the read-only mounts. CPU usage needs
 * two samples: the previous call's sample is reused when it is recent,
 * otherwise a second one is taken 250 ms later.
 */
export class HostMetricsReader {
  private previous: CpuSample | null = null;
  private lastPercent: number | null = null;

  constructor(private readonly config: ReaderConfig) {}

  private async cpuSample(): Promise<{
    sample: CpuSample | null;
    cpus: number;
  }> {
    const stat = await readFile(join(this.config.procDir, 'stat'), 'utf8');
    return { sample: parseCpuLine(stat), cpus: countCpus(stat) };
  }

  private async cpuPercent(): Promise<{
    percent: number | null;
    cpus: number;
  }> {
    let { sample, cpus } = await this.cpuSample();
    if (!sample) return { percent: null, cpus };
    const previous = this.previous;
    if (!previous || sample.at - previous.at > 5 * 60_000) {
      const first = sample;
      await new Promise((resolve) => setTimeout(resolve, 250));
      ({ sample, cpus } = await this.cpuSample());
      if (!sample) return { percent: null, cpus };
      this.lastPercent = cpuPercentBetween(first, sample);
      this.previous = sample;
    } else if (sample.at - previous.at >= 1000) {
      this.lastPercent =
        cpuPercentBetween(previous, sample) ?? this.lastPercent;
      this.previous = sample;
    }
    return { percent: this.lastPercent, cpus };
  }

  async read(): Promise<HostMetrics> {
    const proc = this.config.procDir;
    const [meminfo, loadavg, uptime, cpu, root, storage] = await Promise.all([
      readFile(join(proc, 'meminfo'), 'utf8'),
      readFile(join(proc, 'loadavg'), 'utf8'),
      readFile(join(proc, 'uptime'), 'utf8').catch(() => '0'),
      this.cpuPercent().catch(() => ({ percent: null, cpus: 1 })),
      diskUsage(this.config.varLogDir, 'Root (/)'),
      diskUsage(
        this.config.mysqlDataDir,
        'Storage (/opt/enem-landing/storage)',
      ),
    ]);
    const mem = parseMeminfo(meminfo);
    const total = mem['MemTotal'] ?? 0;
    const available = mem['MemAvailable'] ?? mem['MemFree'] ?? 0;
    const swapTotal = mem['SwapTotal'] ?? 0;
    const swapUsed = swapTotal - (mem['SwapFree'] ?? 0);
    const [l1, l5, l15] = loadavg.trim().split(/\s+/).map(Number);
    const disks: DiskUsage[] = [];
    if (root) disks.push(root);
    // Same filesystem as / on a single-disk VPS: only listed when it differs.
    if (
      storage &&
      (!root || storage.total !== root.total || storage.used !== root.used)
    ) {
      disks.push(storage);
    }
    return {
      time: new Date().toISOString(),
      cpuPercent: cpu.percent,
      cpuCount: cpu.cpus,
      memory: {
        total,
        used: total - available,
        available,
        percent: percent(total - available, total),
      },
      swap: {
        total: swapTotal,
        used: swapUsed,
        percent: percent(swapUsed, swapTotal),
      },
      load: [l1 || 0, l5 || 0, l15 || 0],
      uptimeSeconds: Math.round(Number(uptime.split(/\s+/)[0]) || 0),
      disks,
    };
  }
}
