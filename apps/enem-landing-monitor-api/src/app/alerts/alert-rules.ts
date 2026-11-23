import type {
  AlertRule,
  AlertRuleId,
  AlertRuleUpdate,
} from '@enem-landing/shared-types';

export interface RuleDefinition extends AlertRule {
  /**
   * Consecutive failing checks (one per minute) before a stateful rule
   * fires. `'threshold'` uses the rule's own threshold (MySQL down after
   * 2 checks, site down after 3).
   */
  requiredChecks: number | 'threshold';
  /** Bounds for the threshold in the rules UI. */
  min?: number;
  max?: number;
}

const rule = (
  definition: Omit<RuleDefinition, 'enabled' | 'requiredChecks'> &
    Partial<Pick<RuleDefinition, 'enabled' | 'requiredChecks'>>,
): RuleDefinition => ({ enabled: true, requiredChecks: 1, ...definition });

/** Defaults in code; overrides live in Redis (`alert-rules`). */
export const RULE_DEFINITIONS: RuleDefinition[] = [
  rule({
    id: 'container-crash',
    label: 'Container crash',
    description:
      'Container berhenti dengan exit code bukan 0/143 (semua stack).',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 30,
    stateful: false,
  }),
  rule({
    id: 'container-oom',
    label: 'Container OOMKilled',
    description: 'Container dihentikan karena melewati limit memory.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 30,
    stateful: false,
  }),
  rule({
    id: 'kernel-oom',
    label: 'Event OOM kernel baru',
    description: 'Jumlah baris OOM di kern.log naik sejak cek terakhir.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 30,
    stateful: false,
  }),
  rule({
    id: 'mysql-down',
    label: 'MySQL tidak jalan',
    description: 'Tidak ada container mysql_mysql yang jalan.',
    severity: 'critical',
    threshold: 2,
    thresholdUnit: 'cek berturut',
    cooldownMinutes: 30,
    stateful: true,
    requiredChecks: 'threshold',
    min: 1,
    max: 30,
  }),
  rule({
    id: 'redis-down',
    label: 'Redis tidak jalan',
    description: 'Tidak ada container redis_redis yang jalan.',
    severity: 'critical',
    threshold: 2,
    thresholdUnit: 'cek berturut',
    cooldownMinutes: 30,
    stateful: true,
    requiredChecks: 'threshold',
    min: 1,
    max: 30,
  }),
  rule({
    id: 'redis-ping',
    label: 'Redis tidak bisa di-ping',
    description: 'PING ke Redis dari monitor-api gagal.',
    severity: 'critical',
    threshold: 2,
    thresholdUnit: 'cek berturut',
    cooldownMinutes: 30,
    stateful: true,
    requiredChecks: 'threshold',
    min: 1,
    max: 30,
  }),
  rule({
    id: 'failed-login-spike',
    label: 'Lonjakan login gagal',
    description: 'Login gagal (btmp) dalam 60 menit terakhir di atas ambang.',
    severity: 'warning',
    threshold: 2000,
    thresholdUnit: 'per jam',
    cooldownMinutes: 60,
    stateful: true,
    min: 10,
    max: 1_000_000,
  }),
  rule({
    id: 'backup-failed',
    label: 'Backup MySQL gagal',
    description: 'Webhook dari mysql-backup.sh melaporkan kegagalan.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 30,
    stateful: false,
  }),
  rule({
    id: 'container-memory',
    label: 'Memory container tinggi',
    description:
      'Memory container di atas ambang dari limit-nya selama 5 menit.',
    severity: 'warning',
    threshold: 90,
    thresholdUnit: '% limit',
    cooldownMinutes: 30,
    stateful: true,
    requiredChecks: 5,
    min: 50,
    max: 100,
  }),
  rule({
    id: 'disk-usage',
    label: 'Disk hampir penuh',
    description: 'Pemakaian disk host di atas ambang.',
    severity: 'warning',
    threshold: 80,
    thresholdUnit: '%',
    cooldownMinutes: 360,
    stateful: true,
    min: 50,
    max: 99,
  }),
  rule({
    id: 'swap-usage',
    label: 'Swap tinggi',
    description: 'Pemakaian swap host di atas ambang.',
    severity: 'warning',
    threshold: 50,
    thresholdUnit: '%',
    cooldownMinutes: 60,
    stateful: true,
    min: 10,
    max: 100,
  }),
  rule({
    id: 'load-high',
    label: 'Load tinggi',
    description:
      'Load rata-rata 5 menit di atas ambang x jumlah vCPU selama 10 menit.',
    severity: 'warning',
    threshold: 2,
    thresholdUnit: 'x vCPU',
    cooldownMinutes: 60,
    stateful: true,
    requiredChecks: 10,
    min: 0.5,
    max: 20,
  }),
  rule({
    id: 'uptime-down',
    label: 'Situs atau API down',
    description:
      'Target uptime gagal (bukan 2xx/3xx atau timeout) berturut-turut.',
    severity: 'critical',
    threshold: 3,
    thresholdUnit: 'cek berturut',
    cooldownMinutes: 30,
    stateful: true,
    requiredChecks: 'threshold',
    min: 1,
    max: 30,
  }),
  rule({
    id: 'tls-expiry',
    label: 'Sertifikat TLS hampir habis',
    description: 'Sisa masa berlaku sertifikat di bawah ambang.',
    severity: 'warning',
    threshold: 14,
    thresholdUnit: 'hari',
    cooldownMinutes: 1440,
    stateful: true,
    min: 1,
    max: 60,
  }),
  rule({
    id: 'backup-stale',
    label: 'Backup MySQL terlambat atau gagal',
    description:
      'Backup terakhir lebih lama dari ambang, atau run terakhir gagal.',
    severity: 'critical',
    threshold: 26,
    thresholdUnit: 'jam',
    cooldownMinutes: 360,
    stateful: true,
    min: 2,
    max: 240,
  }),
  rule({
    id: 'login-new-ip',
    label: 'Login sukses dari IP baru',
    description:
      'Login SSH sukses dari IP yang belum ada di daftar IP dikenal.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 10,
    stateful: false,
  }),
  rule({
    id: 'login-password',
    label: 'Login sukses memakai password',
    description: 'Login SSH sukses dengan password, bukan key.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 10,
    stateful: false,
  }),
  rule({
    id: 'login-root',
    label: 'Login sukses sebagai root',
    description: 'Login SSH sukses sebagai user root.',
    severity: 'warning',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 10,
    stateful: false,
  }),
  rule({
    id: 'mysql-connections',
    label: 'Koneksi MySQL tinggi',
    description: 'Threads_connected di atas ambang dari max_connections.',
    severity: 'warning',
    threshold: 80,
    thresholdUnit: '%',
    cooldownMinutes: 60,
    stateful: true,
    min: 10,
    max: 100,
  }),
  rule({
    id: 'redis-memory',
    label: 'Memory Redis tinggi',
    description: 'used_memory di atas ambang dari maxmemory.',
    severity: 'warning',
    threshold: 85,
    thresholdUnit: '%',
    cooldownMinutes: 60,
    stateful: true,
    min: 10,
    max: 100,
  }),
  rule({
    id: 'redis-evictions',
    label: 'Redis mengeluarkan key',
    description: 'evicted_keys naik sejak cek terakhir (maxmemory penuh).',
    severity: 'warning',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 60,
    stateful: false,
  }),
  rule({
    id: 'redis-aof',
    label: 'AOF Redis gagal',
    description: 'Status tulis atau rewrite AOF terakhir bukan ok.',
    severity: 'critical',
    threshold: null,
    thresholdUnit: null,
    cooldownMinutes: 60,
    stateful: true,
  }),
];

export const RULE_IDS = RULE_DEFINITIONS.map((definition) => definition.id);

export const findDefinition = (id: string): RuleDefinition | undefined =>
  RULE_DEFINITIONS.find((definition) => definition.id === id);

export type RuleOverrides = Partial<Record<AlertRuleId, AlertRuleUpdate>>;

/** Defaults with the stored overrides on top; out-of-range values fall back. */
export const applyOverrides = (
  overrides: RuleOverrides | null,
): RuleDefinition[] =>
  RULE_DEFINITIONS.map((definition) => {
    const override = overrides?.[definition.id] ?? {};
    const threshold =
      definition.threshold !== null &&
      typeof override.threshold === 'number' &&
      override.threshold >= (definition.min ?? -Infinity) &&
      override.threshold <= (definition.max ?? Infinity)
        ? override.threshold
        : definition.threshold;
    return {
      ...definition,
      enabled:
        typeof override.enabled === 'boolean'
          ? override.enabled
          : definition.enabled,
      threshold,
      cooldownMinutes:
        typeof override.cooldownMinutes === 'number' &&
        override.cooldownMinutes >= 0 &&
        override.cooldownMinutes <= 10_080
          ? override.cooldownMinutes
          : definition.cooldownMinutes,
    };
  });

export const requiredChecksOf = (definition: RuleDefinition): number =>
  definition.requiredChecks === 'threshold'
    ? Math.max(1, Math.round(definition.threshold ?? 1))
    : definition.requiredChecks;
