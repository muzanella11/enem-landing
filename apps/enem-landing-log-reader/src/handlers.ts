import { readdir, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type {
  BackupStatus,
  ContainerList,
  ContainerMetricsList,
  HostMetrics,
  MysqlSizes,
  SecuritySummary,
  SlowQueryPattern,
  SuccessfulLogin,
  TimelinePage,
  ContainerLogLine,
  FaillogRecord,
  JournalPage,
  LastlogRecord,
  LogPage,
  LogsSummary,
  LoginRecord,
  LogSourceInfo,
  MysqlSlowEntry,
} from '@enem-landing/shared-types';
import type { ReaderConfig } from './config.js';
import { readBackupStatus } from './backup/status.js';
import { categoryOf, ContainerScanner } from './containers/scanner.js';
import { HttpError } from './errors.js';
import { followFile } from './follow.js';
import { ContainerMetricsReader } from './metrics/containers.js';
import { HostMetricsReader } from './metrics/host.js';
import { readSlowPatterns } from './mysql/slow-patterns.js';
import { readMysqlSizes } from './mysql/sizes.js';
import { parseContainerLineTime, parseLineTime } from './readers/line-time.js';
import { seekTime } from './readers/seek.js';
import {
  aggregateFailedLogins,
  buildSummary,
  mergeLogins,
  readAcceptedLogins,
  readWtmpLogins,
} from './security/summary.js';
import { MAX_WINDOW_MINUTES, readTimeline } from './timeline.js';
import {
  CURSOR_PATTERN,
  listJournalUnits,
  readJournal,
  TIME_PATTERN,
  UNIT_PATTERN,
} from './journal/journal.js';
import { assertInsideRoot } from './paths.js';
import {
  beforeParam,
  categoriesParam,
  fileIndexParam,
  limitParam,
  optionalInt,
  patternParam,
  searchParam,
  serviceParam,
  streamParam,
  timeParam,
} from './query.js';
import { createContainerLineTransform } from './readers/container-log.js';
import { readFaillog, readLastlog } from './readers/lastlog.js';
import { createSlowLogTransform } from './readers/mysql-slow.js';
import { readPasswd } from './readers/passwd.js';
import { tailFile, textMatcher } from './readers/tail-reader.js';
import { countUtmpSince, readUtmpPage } from './readers/utmp.js';
import {
  describeSource,
  findSource,
  type ResolvedFile,
  SOURCES,
} from './sources/catalog.js';

type SourceEntries =
  | LogPage<string>
  | LogPage<LoginRecord>
  | LogPage<LastlogRecord>
  | LogPage<FaillogRecord>
  | LogPage<MysqlSlowEntry>;

const OOM_PATTERN = /out of memory|oom-kill|oom_reaper/i;

const pickFile = async (
  files: ResolvedFile[],
  index: number,
): Promise<ResolvedFile> => {
  const file = files[index];
  if (!file) throw new HttpError(404, 'Log file not found');
  if (!file.supported)
    throw new HttpError(415, `Unsupported file format: ${file.name}`);
  await assertInsideRoot(file.root, file.path);
  return file;
};

const HOUR_MS = 60 * 60 * 1000;

export class Handlers {
  readonly scanner: ContainerScanner;
  private readonly hostMetricsReader: HostMetricsReader;
  private readonly containerMetricsReader: ContainerMetricsReader;

  constructor(
    private readonly config: ReaderConfig,
    scanner?: ContainerScanner,
  ) {
    this.scanner = scanner ?? new ContainerScanner(config.containersDir);
    this.hostMetricsReader = new HostMetricsReader(config);
    this.containerMetricsReader = new ContainerMetricsReader(
      config,
      this.scanner,
    );
  }

  private async activeFile(id: string): Promise<ResolvedFile | undefined> {
    return (await findSource(id)?.resolve(this.config))?.[0];
  }

  sources(): Promise<LogSourceInfo[]> {
    return Promise.all(
      SOURCES.map((source) => describeSource(source, this.config)),
    );
  }

  async sourceEntries(
    id: string,
    params: URLSearchParams,
    deadline: number,
  ): Promise<SourceEntries> {
    const source = findSource(id);
    if (!source || source.format === 'journal')
      throw new HttpError(404, 'Unknown log source');
    const file = await pickFile(
      await source.resolve(this.config),
      fileIndexParam(params),
    );
    const limit = limitParam(params);
    const before = beforeParam(params);
    const match = textMatcher(searchParam(params));

    switch (source.format) {
      case 'utmp':
        return readUtmpPage(file.path, {
          before,
          limit,
          deadline,
          match: (record) =>
            match(
              `${record.user} ${record.host} ${record.ip} ${record.line} ${record.type}`,
            ),
        });
      case 'lastlog':
      case 'faillog': {
        const users = await readPasswd(this.config.passwdFile);
        const { entries, fileSize } =
          source.format === 'lastlog'
            ? await readLastlog(file.path, users)
            : await readFaillog(file.path, users);
        const filtered = (
          entries as Array<LastlogRecord | FaillogRecord>
        ).filter((entry) => match(Object.values(entry).join(' ')));
        return {
          entries: filtered,
          nextBefore: null,
          truncated: false,
          fileSize,
        } as SourceEntries;
      }
      case 'mysql-slow':
        return tailFile(file.path, file.compressed, {
          before,
          limit,
          deadline,
          transform: createSlowLogTransform(match),
        });
      default:
        return tailFile(file.path, file.compressed, {
          before,
          limit,
          deadline,
          transform: (line) => (match(line) ? line : null),
        });
    }
  }

  journal(params: URLSearchParams, deadline: number): Promise<JournalPage> {
    return readJournal(
      this.config.journalctlBin,
      this.config.journalDir,
      {
        unit: patternParam(params, 'unit', UNIT_PATTERN),
        priority: optionalInt(params, 'priority', 0, 7),
        since: patternParam(params, 'since', TIME_PATTERN),
        until: patternParam(params, 'until', TIME_PATTERN),
        cursor: patternParam(params, 'cursor', CURSOR_PATTERN),
        limit: limitParam(params),
        q: searchParam(params),
      },
      Math.max(1000, deadline - Date.now()),
    );
  }

  journalUnits(deadline: number): Promise<string[]> {
    return listJournalUnits(
      this.config.journalctlBin,
      this.config.journalDir,
      Math.max(1000, deadline - Date.now()),
    );
  }

  containers(): Promise<ContainerList> {
    return this.scanner.list();
  }

  async containerEntries(
    id: string,
    params: URLSearchParams,
    deadline: number,
  ): Promise<LogPage<ContainerLogLine>> {
    const container = await this.scanner.find(id);
    if (!container) throw new HttpError(404, 'Unknown container');
    const file = await pickFile(container.logFiles, fileIndexParam(params));
    return tailFile(file.path, file.compressed, {
      before: beforeParam(params),
      limit: limitParam(params),
      deadline,
      transform: createContainerLineTransform(
        textMatcher(searchParam(params)),
        streamParam(params),
      ),
    });
  }

  async summary(deadline: number): Promise<LogsSummary> {
    const sources = await this.sources();
    const resolved = async (id: string) =>
      (await findSource(id)?.resolve(this.config))?.[0];

    const btmp = await resolved('btmp');
    const failedLogins24h = btmp
      ? await countUtmpSince(
          btmp.path,
          Date.now() - 24 * 60 * 60 * 1000,
          deadline,
        ).catch(() => null)
      : null;

    const kern = await resolved('kern');
    let oomEvents: number | null = null;
    if (kern && !kern.compressed) {
      let count = 0;
      const page = await tailFile(kern.path, false, {
        limit: 1_000_000,
        deadline,
        maxScanBytes: 16 * 1024 * 1024,
        transform: (line) => {
          if (OOM_PATTERN.test(line)) count += 1;
          return null;
        },
      }).catch(() => null);
      oomEvents = page ? count : null;
    }

    return {
      sources,
      failedLogins24h,
      oomEvents,
      journalSize: await this.journalSize(),
    };
  }

  hostMetrics(): Promise<HostMetrics> {
    return this.hostMetricsReader.read();
  }

  containerMetrics(): Promise<ContainerMetricsList> {
    return this.containerMetricsReader.read();
  }

  async securitySummary(
    params: URLSearchParams,
    deadline: number,
  ): Promise<SecuritySummary> {
    const hours = optionalInt(params, 'hours', 1, 168) ?? 24;
    const now = Date.now();
    const since = now - hours * HOUR_MS;
    const btmp = await this.activeFile('btmp');
    const failed = btmp
      ? await aggregateFailedLogins(btmp.path, since, deadline).catch(
          () => null,
        )
      : null;
    return buildSummary(
      hours,
      since,
      now,
      failed,
      await this.successfulLogins(since, deadline),
    );
  }

  async securityLogins(
    params: URLSearchParams,
    deadline: number,
  ): Promise<SuccessfulLogin[]> {
    const hours = optionalInt(params, 'hours', 1, 168) ?? 1;
    return this.successfulLogins(Date.now() - hours * HOUR_MS, deadline);
  }

  /** Failed logins in the last `minutes` (alert rule "lonjakan login gagal"). */
  async failedCount(
    params: URLSearchParams,
    deadline: number,
  ): Promise<{ minutes: number; count: number | null }> {
    const minutes = optionalInt(params, 'minutes', 1, 1440) ?? 60;
    const btmp = await this.activeFile('btmp');
    const count = btmp
      ? await countUtmpSince(
          btmp.path,
          Date.now() - minutes * 60_000,
          deadline,
        ).catch(() => null)
      : null;
    return { minutes, count };
  }

  private async successfulLogins(
    sinceMs: number,
    deadline: number,
  ): Promise<SuccessfulLogin[]> {
    const [auth, wtmp] = await Promise.all([
      this.activeFile('auth'),
      this.activeFile('wtmp'),
    ]);
    const fromAuth =
      auth && auth.supported
        ? await readAcceptedLogins(
            auth.path,
            auth.compressed,
            sinceMs,
            deadline,
          ).catch(() => [])
        : [];
    const fromWtmp = wtmp
      ? await readWtmpLogins(wtmp.path, sinceMs).catch(() => [])
      : [];
    return mergeLogins(fromAuth, fromWtmp).slice(0, 500);
  }

  backupStatus(deadline: number): Promise<BackupStatus> {
    return readBackupStatus(
      this.config.journalctlBin,
      this.config.journalDir,
      Math.max(1000, deadline - Date.now()),
    );
  }

  mysqlSizes(): Promise<MysqlSizes> {
    return readMysqlSizes(this.config.mysqlDataDir);
  }

  async mysqlSlowPatterns(deadline: number): Promise<{
    patterns: SlowQueryPattern[];
    entries: number;
    truncated: boolean;
  }> {
    const file = await this.activeFile('mysql-slow');
    if (!file) return { patterns: [], entries: 0, truncated: false };
    await assertInsideRoot(file.root, file.path);
    return readSlowPatterns(file.path, file.compressed, deadline);
  }

  timeline(params: URLSearchParams, deadline: number): Promise<TimelinePage> {
    const around = timeParam(params, 'around');
    const window = optionalInt(params, 'window', 1, MAX_WINDOW_MINUTES) ?? 4;
    const categories = categoriesParam(params);
    const service = serviceParam(params);
    const half = (window * 60_000) / 2;
    return readTimeline(
      this.scanner,
      around - half,
      around + half,
      deadline,
      (svc, stack) => {
        if (service && svc !== service) return false;
        if (!categories) return true;
        return categories.has(categoryOf(stack));
      },
    );
  }

  /** Offset to pass as `before` so a page ends at `time` (jump to time). */
  async sourceSeek(
    id: string,
    params: URLSearchParams,
  ): Promise<{ before: number; fileSize: number }> {
    const source = findSource(id);
    if (!source || source.format !== 'text')
      throw new HttpError(404, 'Jump to time works on text logs only');
    const file = await pickFile(
      await source.resolve(this.config),
      fileIndexParam(params),
    );
    if (file.compressed)
      throw new HttpError(415, 'Jump to time works on uncompressed files only');
    const now = Date.now();
    const { offset, fileSize } = await seekTime(
      file.path,
      timeParam(params, 'time'),
      (line) => parseLineTime(line, now),
    );
    return { before: offset, fileSize };
  }

  async containerSeek(
    id: string,
    params: URLSearchParams,
  ): Promise<{ before: number; fileSize: number }> {
    const container = await this.scanner.find(id);
    if (!container) throw new HttpError(404, 'Unknown container');
    const file = await pickFile(container.logFiles, fileIndexParam(params));
    if (file.compressed)
      throw new HttpError(415, 'Jump to time works on uncompressed files only');
    const { offset, fileSize } = await seekTime(
      file.path,
      timeParam(params, 'time'),
      parseContainerLineTime,
    );
    return { before: offset, fileSize };
  }

  async followSource(
    id: string,
    params: URLSearchParams,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const source = findSource(id);
    if (!source || source.format !== 'text')
      throw new HttpError(404, 'Live tail works on text logs only');
    const file = await pickFile(await source.resolve(this.config), 0);
    if (file.compressed) throw new HttpError(415, 'Unsupported file format');
    const match = textMatcher(searchParam(params));
    await followFile(req, res, {
      path: file.path,
      transform: (line) => (match(line) ? line : null),
    });
  }

  async followContainer(
    id: string,
    params: URLSearchParams,
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const container = await this.scanner.find(id);
    if (!container || !container.running)
      throw new HttpError(404, 'Live tail needs a running container');
    const file = await pickFile(container.logFiles, 0);
    await followFile(req, res, {
      path: file.path,
      transform: createContainerLineTransform(
        textMatcher(searchParam(params)),
        streamParam(params),
      ),
    });
  }

  private async journalSize(): Promise<number | null> {
    try {
      let total = 0;
      for (const machine of await readdir(this.config.journalDir)) {
        const dir = join(this.config.journalDir, machine);
        if (!(await stat(dir)).isDirectory()) continue;
        for (const name of await readdir(dir)) {
          total += (await stat(join(dir, name))).size;
        }
      }
      return total;
    } catch {
      return null;
    }
  }
}
