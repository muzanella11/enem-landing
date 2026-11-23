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
  /** `Config.Image` from config.v2.json, e.g. `ghcr.io/x/enem-landing-api:prod`. */
  image: string;
  /** Image id (`sha256:...`). */
  imageId: string;
  /** When the container was created (= deployed). */
  createdAt: string | null;
  /** OCI labels copied from the image (`org.opencontainers.image.*`). */
  version: string | null;
  revision: string | null;
  source: string | null;
  imageCreated: string | null;
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

// ---------------------------------------------------------------- alerts

export type AlertSeverity = 'critical' | 'warning' | 'info';

/** `firing` when a problem is found, `resolved` once it is gone again. */
export type AlertKind = 'firing' | 'resolved';

/**
 * What happened to the email of one alert:
 * - `queued`: waiting in the outbox (or between retries);
 * - `sent`: delivered to account-api, which sent it;
 * - `failed`: every retry failed (see `emailError`);
 * - `cooldown`: same key alerted less than `cooldownMinutes` ago;
 * - `dev-disabled`: this environment never sends email (dev, local, e2e);
 * - `cms-disabled`: "Email alert monitor" is off in CMS Settings;
 * - `dropped`: the outbox was full (200 items) and this was the oldest.
 */
export type AlertEmailStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'cooldown'
  | 'dev-disabled'
  | 'cms-disabled'
  | 'dropped';

export type AlertRuleId =
  | 'container-crash'
  | 'container-oom'
  | 'kernel-oom'
  | 'mysql-down'
  | 'redis-down'
  | 'redis-ping'
  | 'failed-login-spike'
  | 'backup-failed'
  | 'container-memory'
  | 'disk-usage'
  | 'swap-usage'
  | 'load-high'
  | 'uptime-down'
  | 'tls-expiry'
  | 'backup-stale'
  | 'login-new-ip'
  | 'login-password'
  | 'login-root'
  | 'mysql-connections'
  | 'redis-memory'
  | 'redis-evictions'
  | 'redis-aof';

export interface AlertRule {
  id: AlertRuleId;
  label: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  /** `null` for rules without a number to tune. */
  threshold: number | null;
  thresholdUnit: string | null;
  cooldownMinutes: number;
  /** Rules with a state send one "resolved" email when the problem is gone. */
  stateful: boolean;
}

export interface AlertRuleUpdate {
  enabled?: boolean;
  threshold?: number;
  cooldownMinutes?: number;
}

export interface AlertEntry {
  id: string;
  time: string;
  environment: string;
  ruleId: AlertRuleId;
  /** Dedup/cooldown key, e.g. `container-crash:enem-landing_enem-landing-api`. */
  key: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  summary: string;
  /** Up to 30 lines (log excerpt, numbers). */
  details: string[];
  /** Monitor path of the related page, e.g. `/apps`. */
  link: string;
  emailStatus: AlertEmailStatus;
  emailError?: string;
  emailAttempts?: number;
}

export interface AlertsOverview {
  last24h: number;
  latest: AlertEntry | null;
  /** Keys of stateful rules currently firing (not yet resolved). */
  active: Array<{
    key: string;
    ruleId: AlertRuleId;
    since: string;
    title: string;
  }>;
  outboxSize: number;
  emailEnabled: boolean;
}

/** Body `POST /email/internal/monitor-alert` (account-api). No recipient on purpose. */
export interface MonitorAlertEmailPayload {
  title: string;
  severity: AlertSeverity;
  kind: AlertKind;
  environment: string;
  time: string;
  summary: string;
  details: string[];
  url: string;
}

// --------------------------------------------------------------- metrics

export interface DiskUsage {
  mount: string;
  label: string;
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface HostMetrics {
  time: string;
  cpuPercent: number | null;
  cpuCount: number;
  memory: { total: number; used: number; available: number; percent: number };
  swap: { total: number; used: number; percent: number };
  load: [number, number, number];
  uptimeSeconds: number;
  disks: DiskUsage[];
}

export interface ContainerMetrics {
  id: string;
  name: string;
  service: string;
  stack: string;
  category: ContainerCategory;
  memoryCurrent: number | null;
  /** `null` when the container has no memory limit (`max`). */
  memoryMax: number | null;
  memoryPeak: number | null;
  memoryPercent: number | null;
  oomKills: number | null;
  cpuPercent: number | null;
}

export interface ContainerMetricsList {
  time: string;
  containers: ContainerMetrics[];
  /** Sum of every running container's limit, compared with host RAM. */
  totalLimits: number;
  hostMemory: number;
}

/** One series of per-minute samples, oldest first. */
export interface MetricSeries {
  name: string;
  unit: '%' | 'bytes' | 'load' | 'ms';
  points: Array<[number, number]>;
}

// ---------------------------------------------------------------- uptime

export type UptimeTargetKind = 'site' | 'api' | 'datastore';

export interface UptimeTargetStatus {
  id: string;
  label: string;
  kind: UptimeTargetKind;
  url: string;
  up: boolean | null;
  lastStatus: number | null;
  lastLatencyMs: number | null;
  lastError: string | null;
  lastCheckedAt: string | null;
  consecutiveFailures: number;
  uptime24h: number | null;
  uptime7d: number | null;
  latency24h: Array<[number, number]>;
}

export interface UptimeIncident {
  targetId: string;
  label: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  error: string | null;
}

export interface TlsCertStatus {
  host: string;
  validTo: string | null;
  daysLeft: number | null;
  issuer: string | null;
  error: string | null;
  checkedAt: string;
}

export interface BackupRun {
  time: string;
  ok: boolean;
  message: string;
}

export interface BackupStatus {
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastRun: BackupRun | null;
  runs: BackupRun[];
  /** `journalctl` was not available or the unit has no entries. */
  available: boolean;
}

export interface UptimeOverview {
  targets: UptimeTargetStatus[];
  incidents: UptimeIncident[];
  tls: TlsCertStatus[];
  backup: BackupStatus | null;
}

// -------------------------------------------------------------- security

export interface SecurityIpStat {
  ip: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  topUser: string;
  country?: string | null;
  countryCode?: string | null;
  asn?: string | null;
}

export interface SuccessfulLogin {
  time: string;
  user: string;
  ip: string;
  method: 'publickey' | 'password' | 'other';
  source: 'wtmp' | 'auth.log';
  known?: boolean;
  knownLabel?: string | null;
}

export interface SecuritySummary {
  hours: number;
  failedTotal: number;
  uniqueIps: number;
  failedPerHour: Array<[number, number]>;
  topIps: SecurityIpStat[];
  topUsers: Array<{ user: string; count: number }>;
  logins: SuccessfulLogin[];
  /** The btmp scan stopped early (time or size budget). */
  truncated: boolean;
}

export interface KnownIp {
  ip: string;
  label: string;
  addedAt: string;
  auto: boolean;
}

// --------------------------------------------------------------- DB/Redis

export interface MysqlStats {
  connected: boolean;
  error?: string;
  uptimeSeconds: number | null;
  threadsConnected: number | null;
  threadsRunning: number | null;
  maxConnections: number | null;
  maxUsedConnections: number | null;
  slowQueries: number | null;
  abortedConnects: number | null;
  questions: number | null;
  innodbBufferPoolSize: number | null;
  longRunning: Array<{
    id: number;
    user: string;
    host: string;
    db: string | null;
    command: string;
    time: number;
    state: string | null;
    info: string | null;
  }>;
}

export interface MysqlTableSize {
  database: string;
  table: string;
  bytes: number;
}

export interface MysqlSizes {
  totalBytes: number;
  databases: Array<{ name: string; bytes: number; tables: number }>;
  topTables: MysqlTableSize[];
}

export interface SlowQueryPattern {
  pattern: string;
  count: number;
  totalTime: number;
  avgTime: number;
  maxTime: number;
  lastSeen: string;
  rowsExamined: number;
}

export interface RedisStats {
  connected: boolean;
  version: string | null;
  uptimeSeconds: number | null;
  usedMemory: number | null;
  maxMemory: number | null;
  memoryPercent: number | null;
  fragmentationRatio: number | null;
  evictedKeys: number | null;
  expiredKeys: number | null;
  keyspaceHits: number | null;
  keyspaceMisses: number | null;
  hitRate: number | null;
  connectedClients: number | null;
  aofEnabled: boolean | null;
  aofLastWriteStatus: string | null;
  aofLastRewriteStatus: string | null;
  totalKeys: number | null;
  keysByPrefix: Array<{ prefix: string; count: number }>;
  keysScannedAt: string | null;
  keysTruncated: boolean;
}

/** One public response cache key of enem-landing-api (`GET /cache`). */
export interface CacheEntryInfo {
  key: string;
  ttl: number;
  sizeBytes: number;
  hits: number;
  misses: number;
  active: boolean;
}

export interface CacheOverview {
  connected: boolean;
  keys: CacheEntryInfo[];
}

// ---------------------------------------------------------------- deploy

export interface DeployServiceVersion {
  service: string;
  environment: 'prod' | 'dev';
  containerId: string;
  image: string;
  version: string | null;
  revision: string | null;
  source: string | null;
  deployedAt: string | null;
  imageCreated: string | null;
}

export interface DeployRow {
  /** Service name without the stack prefix, e.g. `enem-landing-api`. */
  service: string;
  prod: DeployServiceVersion | null;
  dev: DeployServiceVersion | null;
  differs: boolean;
  compareUrl: string | null;
}

export interface DeployHistoryEntry {
  time: string;
  service: string;
  environment: 'prod' | 'dev';
  version: string | null;
  revision: string | null;
  previousVersion: string | null;
  previousRevision: string | null;
  source: string | null;
  rollback: boolean;
}

export interface DeployOverview {
  rows: DeployRow[];
  history: DeployHistoryEntry[];
  lastDeploy: { prod: string | null; dev: string | null };
  prodVersion: string | null;
  differingServices: number;
}

// -------------------------------------------------------------- timeline

export interface TimelineLine {
  time: string;
  containerId: string;
  service: string;
  stack: string;
  category: ContainerCategory;
  stream: ContainerStream;
  message: string;
}

export interface TimelinePage {
  from: string;
  to: string;
  lines: TimelineLine[];
  truncated: boolean;
  /** Containers that stopped with a crash inside the window. */
  crashes: Array<{
    containerId: string;
    service: string;
    finishedAt: string;
    exitCode: number | null;
    oomKilled: boolean;
  }>;
}

/** One SSE `data:` payload of a live tail. */
export interface FollowEvent<T> {
  entries: T[];
  /** The file was rotated or truncated since the last event. */
  rotated?: boolean;
}
