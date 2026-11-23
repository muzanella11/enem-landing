import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  LogFileInfo,
  LogSourceFormat,
  LogSourceGroup,
  LogSourceInfo,
} from '@enem-landing/shared-types';
import type { ReaderConfig } from '../config.js';
import { isPlainName } from '../paths.js';

export interface ResolvedFile extends LogFileInfo {
  /** Absolute path inside the container. Never sent to clients. */
  path: string;
  root: string;
}

type Resolver = (config: ReaderConfig) => Promise<ResolvedFile[]>;

export interface SourceDefinition {
  id: string;
  label: string;
  group: LogSourceGroup;
  format: LogSourceFormat;
  description: string;
  resolve: Resolver;
}

const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toFile = async (
  root: string,
  dir: string,
  name: string,
): Promise<ResolvedFile | null> => {
  if (!isPlainName(name)) return null;
  const path = join(dir, name);
  try {
    const stats = await lstat(path);
    // Symlinks are skipped on purpose: a link under /var/log could point
    // anywhere on the host.
    if (!stats.isFile()) return null;
    return {
      index: 0,
      name,
      path,
      root,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString(),
      compressed: name.endsWith('.gz'),
      supported: !/\.(xz|bz2|zst)$/.test(name),
    };
  } catch {
    return null;
  }
};

const listDir = async (dir: string): Promise<string[]> => {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
};

const withIndexes = (files: Array<ResolvedFile | null>): ResolvedFile[] =>
  files
    .filter((file): file is ResolvedFile => file !== null)
    .map((file, index) => ({ ...file, index }));

/** Rotation number of `auth.log.2.gz` -> 2, `auth.log` -> -1 (active file first). */
const rotationNumber = (name: string, base: string): number => {
  const rest = name.slice(base.length);
  const match = /^\.(\d+)/.exec(rest);
  return match ? Number(match[1]) : -1;
};

/** `base` plus its rotations (`base.1`, `base.2.gz`, `base.0`, `base.xz`). */
const rotated =
  (
    rootKey: 'varLogDir' | 'mysqlLogsDir',
    relativeDir: string,
    base: string,
  ): Resolver =>
  async (config) => {
    const root = config[rootKey];
    const dir = join(root, relativeDir);
    const pattern = new RegExp(`^${escapeRegex(base)}(\\.\\d+)?(\\.(gz|xz))?$`);
    const names = (await listDir(dir))
      .filter((name) => pattern.test(name))
      .sort(
        (a, b) =>
          rotationNumber(a, base) - rotationNumber(b, base) ||
          a.localeCompare(b),
      );
    return withIndexes(
      await Promise.all(names.map((name) => toFile(root, dir, name))),
    );
  };

/** Every regular file in a directory, or only those matching `pattern`. */
const directory =
  (relativeDir: string, pattern?: RegExp): Resolver =>
  async (config) => {
    const root = config.varLogDir;
    const dir = join(root, relativeDir);
    const names = (await listDir(dir))
      .filter((name) => !pattern || pattern.test(name))
      .sort();
    return withIndexes(
      await Promise.all(names.map((name) => toFile(root, dir, name))),
    );
  };

const none: Resolver = async () => [];

/**
 * Allowlist of host log sources. Clients only ever send one of these ids
 * plus a file index; paths are built here, never taken from a request.
 */
export const SOURCES: SourceDefinition[] = [
  // Security and access
  {
    id: 'auth',
    label: 'Auth',
    group: 'security',
    format: 'text',
    description: 'SSH logins (successful and failed), sudo, user changes',
    resolve: rotated('varLogDir', '', 'auth.log'),
  },
  {
    id: 'btmp',
    label: 'Failed logins (btmp)',
    group: 'security',
    format: 'utmp',
    description: 'Every failed login attempt, like `lastb`',
    resolve: rotated('varLogDir', '', 'btmp'),
  },
  {
    id: 'wtmp',
    label: 'Logins (wtmp)',
    group: 'security',
    format: 'utmp',
    description: 'Successful logins, logouts and reboots, like `last`',
    resolve: rotated('varLogDir', '', 'wtmp'),
  },
  {
    id: 'lastlog',
    label: 'Last login',
    group: 'security',
    format: 'lastlog',
    description: 'Last login time per user, like `lastlog`',
    resolve: rotated('varLogDir', '', 'lastlog'),
  },
  {
    id: 'faillog',
    label: 'Faillog',
    group: 'security',
    format: 'faillog',
    description: 'Failed login counters per user, like `faillog`',
    resolve: rotated('varLogDir', '', 'faillog'),
  },
  {
    id: 'ufw',
    label: 'Firewall (UFW)',
    group: 'security',
    format: 'text',
    description: 'Connections blocked by UFW',
    resolve: rotated('varLogDir', '', 'ufw.log'),
  },
  // System
  {
    id: 'journal',
    label: 'Journal',
    group: 'system',
    format: 'journal',
    description: 'Every systemd service: sshd, dockerd, containerd, cron',
    resolve: none,
  },
  {
    id: 'syslog',
    label: 'Syslog',
    group: 'system',
    format: 'text',
    description: 'General system log',
    resolve: rotated('varLogDir', '', 'syslog'),
  },
  {
    id: 'kern',
    label: 'Kernel',
    group: 'system',
    format: 'text',
    description: 'Kernel messages, including the OOM killer',
    resolve: rotated('varLogDir', '', 'kern.log'),
  },
  {
    id: 'dmesg',
    label: 'Dmesg',
    group: 'system',
    format: 'text',
    description: 'Kernel messages at boot',
    resolve: rotated('varLogDir', '', 'dmesg'),
  },
  // Packages and updates
  {
    id: 'apt-history',
    label: 'apt history',
    group: 'packages',
    format: 'text',
    description: 'apt install/upgrade/remove commands',
    resolve: rotated('varLogDir', 'apt', 'history.log'),
  },
  {
    id: 'apt-term',
    label: 'apt terminal',
    group: 'packages',
    format: 'text',
    description: 'Terminal output of apt runs',
    resolve: rotated('varLogDir', 'apt', 'term.log'),
  },
  {
    id: 'apt-eipp',
    label: 'apt EIPP',
    group: 'packages',
    format: 'text',
    description: 'apt planner dump (usually .xz, not supported)',
    resolve: rotated('varLogDir', 'apt', 'eipp.log'),
  },
  {
    id: 'dpkg',
    label: 'dpkg',
    group: 'packages',
    format: 'text',
    description: 'Package state changes',
    resolve: rotated('varLogDir', '', 'dpkg.log'),
  },
  {
    id: 'unattended-upgrades',
    label: 'Unattended upgrades',
    group: 'packages',
    format: 'text',
    description: 'Automatic security updates',
    resolve: directory('unattended-upgrades', /\.log/),
  },
  {
    id: 'alternatives',
    label: 'Alternatives',
    group: 'packages',
    format: 'text',
    description: 'update-alternatives changes',
    resolve: rotated('varLogDir', '', 'alternatives.log'),
  },
  // Initial setup and provider
  {
    id: 'cloud-init',
    label: 'cloud-init',
    group: 'setup',
    format: 'text',
    description: 'First boot provisioning',
    resolve: rotated('varLogDir', '', 'cloud-init.log'),
  },
  {
    id: 'cloud-init-output',
    label: 'cloud-init output',
    group: 'setup',
    format: 'text',
    description: 'Output of the first boot scripts',
    resolve: rotated('varLogDir', '', 'cloud-init-output.log'),
  },
  {
    id: 'installer',
    label: 'Installer',
    group: 'setup',
    format: 'text',
    description: 'OS installer logs',
    resolve: directory('installer'),
  },
  {
    id: 'qcloud',
    label: 'Tencent Cloud',
    group: 'setup',
    format: 'text',
    description: 'Tencent Cloud agent actions',
    resolve: rotated('varLogDir', '', 'qcloud_action.log'),
  },
  {
    id: 'landscape',
    label: 'Landscape',
    group: 'setup',
    format: 'text',
    description: 'Landscape sysinfo',
    resolve: rotated('varLogDir', 'landscape', 'sysinfo.log'),
  },
  {
    id: 'ubuntu-pro',
    label: 'Ubuntu Pro',
    group: 'setup',
    format: 'text',
    description: 'Ubuntu Pro (ubuntu-advantage) client',
    resolve: directory('', /^ubuntu-advantage.*\.log/),
  },
  {
    id: 'apport',
    label: 'Apport (crash)',
    group: 'setup',
    format: 'text',
    description: 'Crash reports',
    resolve: rotated('varLogDir', '', 'apport.log'),
  },
  // DB
  {
    id: 'mysql-slow',
    label: 'MySQL slow query log',
    group: 'db',
    format: 'mysql-slow',
    description: 'Queries slower than long_query_time (1 s)',
    resolve: rotated('mysqlLogsDir', '', 'slow.log'),
  },
];

const SOURCE_BY_ID = new Map(SOURCES.map((source) => [source.id, source]));

/** `undefined` for anything not in the allowlist, including traversal attempts. */
export const findSource = (id: string): SourceDefinition | undefined =>
  SOURCE_BY_ID.get(id);

const publicFile = (file: ResolvedFile): LogFileInfo => ({
  index: file.index,
  name: file.name,
  size: file.size,
  modifiedAt: file.modifiedAt,
  compressed: file.compressed,
  supported: file.supported,
});

export const describeSource = async (
  source: SourceDefinition,
  config: ReaderConfig,
): Promise<LogSourceInfo> => ({
  id: source.id,
  label: source.label,
  group: source.group,
  format: source.format,
  description: source.description,
  files: (await source.resolve(config)).map(publicFile),
});

export const toPublicFile = publicFile;
