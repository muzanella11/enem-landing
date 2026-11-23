import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ContainerList,
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
import { ContainerScanner } from './containers/scanner.js';
import { HttpError } from './errors.js';
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
  fileIndexParam,
  limitParam,
  optionalInt,
  patternParam,
  searchParam,
  streamParam,
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

export class Handlers {
  readonly scanner: ContainerScanner;

  constructor(
    private readonly config: ReaderConfig,
    scanner?: ContainerScanner,
  ) {
    this.scanner = scanner ?? new ContainerScanner(config.containersDir);
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
