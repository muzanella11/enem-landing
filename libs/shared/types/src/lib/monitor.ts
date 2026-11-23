/**
 * Shapes shared by `enem-landing-log-reader`, `enem-landing-monitor-api`
 * and `enem-landing-monitor` (the monitor's Logs menu).
 */

export interface MonitorOverview {
  user: { fullname: string; email: string; role: string };
  environment: string;
  version: string;
  logsEnabled: boolean;
  redisConnected: boolean;
  serverTime: string;
}

/** Which tab/sub-menu a host log source belongs to. */
export type LogSourceGroup =
  'security' | 'system' | 'packages' | 'setup' | 'db';

/** How a source is parsed: drives which viewer the monitor renders. */
export type LogSourceFormat =
  'text' | 'utmp' | 'lastlog' | 'faillog' | 'journal' | 'mysql-slow';

/**
 * One physical file of a source: the active file (index 0), a rotation
 * (`.1`, `.2.gz`) or, for directory sources, one file in the directory.
 * Clients only ever send back `index`, never a path.
 */
export interface LogFileInfo {
  index: number;
  name: string;
  size: number;
  modifiedAt: string;
  compressed: boolean;
  /** `false` for formats the reader can't open (e.g. `.xz`). */
  supported: boolean;
}

export interface LogSourceInfo {
  id: string;
  label: string;
  group: LogSourceGroup;
  format: LogSourceFormat;
  description: string;
  files: LogFileInfo[];
}

/**
 * A page of entries read backwards from the end of a file. `nextBefore` is
 * the cursor for "load older" (a byte offset for text files, a record index
 * for binary files), `null` once the start of the file is reached.
 */
export interface LogPage<T> {
  entries: T[];
  nextBefore: number | null;
  /** The response hit the size, scan or time budget before `limit`. */
  truncated: boolean;
  fileSize: number;
  notice?: string;
}

export type LoginRecordType =
  | 'EMPTY'
  | 'RUN_LVL'
  | 'BOOT_TIME'
  | 'NEW_TIME'
  | 'OLD_TIME'
  | 'INIT_PROCESS'
  | 'LOGIN_PROCESS'
  | 'USER_PROCESS'
  | 'DEAD_PROCESS'
  | 'ACCOUNTING'
  | 'UNKNOWN';

/** One `utmp` record from `btmp` (failed logins) or `wtmp` (logins). */
export interface LoginRecord {
  type: LoginRecordType;
  pid: number;
  line: string;
  user: string;
  host: string;
  ip: string;
  time: string;
}

export interface LastlogRecord {
  uid: number;
  user: string;
  line: string;
  host: string;
  time: string;
}

export interface FaillogRecord {
  uid: number;
  user: string;
  failures: number;
  max: number;
  line: string;
  lastFailure: string | null;
}

export interface MysqlSlowEntry {
  time: string;
  user: string;
  host: string;
  queryTime: number;
  lockTime: number;
  rowsSent: number;
  rowsExamined: number;
  query: string;
}

export interface JournalEntry {
  cursor: string;
  time: string;
  priority: number | null;
  unit: string;
  identifier: string;
  pid: string;
  message: string;
}

/** Journal pages use journald cursors instead of byte offsets. */
export interface JournalPage {
  entries: JournalEntry[];
  nextCursor: string | null;
  truncated: boolean;
  notice?: string;
}

export type ContainerCategory =
  'apps-prod' | 'apps-dev' | 'db' | 'redis' | 'infra';

export interface ContainerInfo {
  id: string;
  name: string;
  /** Swarm service name, or the container name for non-Swarm containers. */
  service: string;
  stack: string;
  category: ContainerCategory;
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  oomKilled: boolean;
  error: string;
  /** Docker's own restart counter plus the stopped tasks of the same service. */
  restartCount: number;
  /** Stopped with a non-zero exit code (other than a SIGTERM stop) or OOM-killed. */
  crashed: boolean;
  /** Running service that has a crashed container in the last 24 hours. */
  recentCrash: boolean;
  files: LogFileInfo[];
}

export interface ContainerList {
  running: ContainerInfo[];
  stopped: ContainerInfo[];
  scannedAt: string;
}

export type ContainerStream = 'stdout' | 'stderr';

export interface ContainerLogLine {
  time: string;
  stream: ContainerStream;
  message: string;
}

export interface LogsSummary {
  sources: LogSourceInfo[];
  failedLogins24h: number | null;
  oomEvents: number | null;
  journalSize: number | null;
}

export interface RedisSlowlogEntry {
  id: number;
  time: string;
  durationMicros: number;
  command: string;
  client: string;
  clientName: string;
}
