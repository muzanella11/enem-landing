import type {
  ContainerMetricsList,
  HostMetrics,
  MetricSeries,
} from '@enem-landing/shared-types';
import { Injectable } from '@nestjs/common';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { MonitorStore } from '../store/monitor-store.js';

const DAY_MS = 86_400_000;
const TTL_SECONDS = 2 * 86_400 + 3600;

/** `host:cpu`, `host:mem`, `host:swap`, `host:load5`, `host:disk0`, `svc:<service>:mem|cpu`. */
export const SERIES_NAME =
  /^(host:(cpu|mem|swap|load5|disk\d)|svc:[A-Za-z0-9_.-]{1,128}:(mem|cpu))$/;

const dayKey = (ms: number): string =>
  new Date(ms).toISOString().slice(0, 10).replace(/-/g, '');

const unitOf = (name: string): MetricSeries['unit'] =>
  name === 'host:load5' ? 'load' : '%';

/** `minute,value;` pairs appended to one string per series per day. */
export const parseSeries = (raw: string | null): Array<[number, number]> => {
  const points: Array<[number, number]> = [];
  for (const pair of (raw ?? '').split(';')) {
    const [time, value] = pair.split(',');
    const t = Number(time);
    const v = Number(value);
    if (pair && Number.isFinite(t) && Number.isFinite(v))
      points.push([t * 60_000, v]);
  }
  return points;
};

/**
 * Per-minute samples without a time-series DB: each series is
 * one Redis string per day that only grows with `APPEND "minute,value;"`
 * (about 10 bytes a sample), expiring after 2 days. Host data, so only the
 * primary monitor (prod) samples, under the shared prefix both read.
 */
@Injectable()
export class MetricsService {
  constructor(
    private readonly reader: LogReaderClient,
    private readonly store: MonitorStore,
  ) {}

  host(): Promise<HostMetrics> {
    return this.reader.get<HostMetrics>('/metrics/host');
  }

  containers(): Promise<ContainerMetricsList> {
    return this.reader.get<ContainerMetricsList>('/metrics/containers');
  }

  async record(
    host: HostMetrics | null,
    containers: ContainerMetricsList | null,
    now = Date.now(),
  ): Promise<void> {
    const values: Array<[string, number | null]> = [];
    if (host) {
      values.push(
        ['host:cpu', host.cpuPercent],
        ['host:mem', host.memory.percent],
        ['host:swap', host.swap.percent],
        ['host:load5', host.load[1]],
      );
      host.disks.forEach((disk, index) =>
        values.push([`host:disk${index}`, disk.percent]),
      );
    }
    for (const container of containers?.containers ?? []) {
      values.push(
        [`svc:${container.service}:mem`, container.memoryPercent],
        [`svc:${container.service}:cpu`, container.cpuPercent],
      );
    }
    const minute = Math.floor(now / 60_000);
    const day = dayKey(now);
    for (const [name, value] of values) {
      if (value === null || !SERIES_NAME.test(name)) continue;
      const key = this.store.shared(`m:${name}:${day}`);
      await this.store.client.append(key, `${minute},${value};`);
      await this.store.client.expire(key, TTL_SECONDS);
    }
  }

  async history(
    names: string[],
    hours = 24,
    now = Date.now(),
  ): Promise<MetricSeries[]> {
    const since = now - hours * 3_600_000;
    const days = [dayKey(since), dayKey(now)].filter(
      (day, index, all) => all.indexOf(day) === index,
    );
    const series: MetricSeries[] = [];
    for (const name of names.filter((value) => SERIES_NAME.test(value))) {
      const raws = await this.store.client.mget(
        ...days.map((day) => this.store.shared(`m:${name}:${day}`)),
      );
      series.push({
        name,
        unit: unitOf(name),
        points: raws
          .flatMap(parseSeries)
          .filter(([time]) => time >= since && time <= now + DAY_MS),
      });
    }
    return series;
  }
}
