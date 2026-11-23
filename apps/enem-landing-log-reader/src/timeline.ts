import type {
  ContainerLogLine,
  TimelineLine,
  TimelinePage,
} from '@enem-landing/shared-types';
import type { ContainerScanner } from './containers/scanner.js';
import { parseContainerLine } from './readers/container-log.js';
import { parseContainerLineTime } from './readers/line-time.js';
import { seekTime } from './readers/seek.js';
import { tailFile } from './readers/tail-reader.js';

export const MAX_TIMELINE_LINES = 2000;
export const MAX_WINDOW_MINUTES = 10;

/**
 * Every container's log (running and stopped) between `from` and `to`,
 * merged by time. Per file: binary search for the end of the window
 * (plain files), then read backwards until a line is older than `from`.
 * Older rotations are only opened while the window reaches past the
 * start of the newer file.
 */
export const readTimeline = async (
  scanner: ContainerScanner,
  fromMs: number,
  toMs: number,
  deadline: number,
  filter?: (service: string, stack: string) => boolean,
): Promise<TimelinePage> => {
  const containers = (await scanner.all()).filter(
    (container) => !filter || filter(container.service, container.stack),
  );
  const lines: TimelineLine[] = [];
  let truncated = false;

  for (const container of containers) {
    if (Date.now() > deadline) {
      truncated = true;
      break;
    }
    if (container.finishedAt && Date.parse(container.finishedAt) < fromMs)
      continue;

    for (const file of container.logFiles) {
      // A rotation that was last written before the window has nothing in it.
      if (Date.parse(file.modifiedAt) < fromMs) break;
      const before = file.compressed
        ? undefined
        : (await seekTime(file.path, toMs, parseContainerLineTime)).offset;
      const page = await tailFile<ContainerLogLine>(
        file.path,
        file.compressed,
        {
          before,
          limit: MAX_TIMELINE_LINES,
          deadline,
          stop: (line) => {
            const time = parseContainerLineTime(line);
            return time !== null && time < fromMs;
          },
          transform: (line) => {
            const parsed = parseContainerLine(line);
            const time = Date.parse(parsed.time);
            return Number.isNaN(time) || time > toMs ? null : parsed;
          },
        },
      );
      for (const entry of page.entries) {
        lines.push({
          ...entry,
          containerId: container.id,
          service: container.service,
          stack: container.stack,
          category: container.category,
        });
      }
      if (page.truncated) truncated = true;
      // Reached the start of this file still inside the window: go on to
      // the next older rotation. Otherwise the window ends in this file.
      if (page.nextBefore !== null || page.entries.length >= MAX_TIMELINE_LINES)
        break;
    }
  }

  lines.sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (lines.length > MAX_TIMELINE_LINES) truncated = true;

  const crashes = containers
    .filter(
      (container) =>
        container.crashed &&
        container.finishedAt !== null &&
        Date.parse(container.finishedAt) >= fromMs &&
        Date.parse(container.finishedAt) <= toMs,
    )
    .map((container) => ({
      containerId: container.id,
      service: container.service,
      finishedAt: container.finishedAt as string,
      exitCode: container.exitCode,
      oomKilled: container.oomKilled,
    }));

  return {
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    // Keep the lines closest to the middle when capping.
    lines: capAroundMiddle(lines, (fromMs + toMs) / 2),
    truncated,
    crashes,
  };
};

const capAroundMiddle = (
  lines: TimelineLine[],
  middleMs: number,
): TimelineLine[] => {
  if (lines.length <= MAX_TIMELINE_LINES) return lines;
  let center = lines.findIndex((line) => Date.parse(line.time) >= middleMs);
  if (center === -1) center = lines.length - 1;
  const start = Math.max(
    0,
    Math.min(
      center - MAX_TIMELINE_LINES / 2,
      lines.length - MAX_TIMELINE_LINES,
    ),
  );
  return lines.slice(start, start + MAX_TIMELINE_LINES);
};
