/** Pure helpers for the log views, kept framework-free so they're unit tested. */

export const formatBytes = (bytes: number | null | undefined): string => {
  if (bytes === null || bytes === undefined) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
};

export const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/** "3 mnt lalu" style, for start/stop times. */
export const formatAgo = (
  iso: string | null | undefined,
  now = Date.now(),
): string => {
  if (!iso) return '-';
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds} dtk lalu`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
};

/** Started less than 5 minutes ago: a fresh deploy or a crash loop. */
export const isRecentStart = (
  iso: string | null | undefined,
  now = Date.now(),
): boolean => Boolean(iso) && now - Date.parse(iso as string) < 5 * 60 * 1000;

export const exitCodeMeaning = (
  code: number | null,
  oomKilled: boolean,
): string => {
  if (oomKilled) return 'OOMKilled: melewati limit memory';
  switch (code) {
    case null:
      return '-';
    case 0:
      return 'Berhenti normal (misalnya deploy)';
    case 1:
      return 'Error di app';
    case 137:
      return 'Di-kill (SIGKILL), sering karena memory';
    case 139:
      return 'Segmentation fault';
    case 143:
      return 'Dihentikan (SIGTERM), biasanya deploy';
    default:
      return code > 128 ? `Dihentikan sinyal ${code - 128}` : 'Error';
  }
};

const HIGHLIGHT =
  /(error|failed|failure|fatal|oom|killed|out of memory|denied|panic)/gi;

export interface TextSegment {
  text: string;
  hit: boolean;
}

/**
 * Splits a line into plain and highlighted parts. Rendered as text nodes
 * (never v-html), so log content can't inject markup.
 */
export const highlightSegments = (
  line: string,
  query?: string,
): TextSegment[] => {
  const words = [HIGHLIGHT.source];
  if (query) words.push(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of line.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last)
      segments.push({ text: line.slice(last, index), hit: false });
    segments.push({ text: match[0], hit: true });
    last = index + match[0].length;
  }
  if (last < line.length) segments.push({ text: line.slice(last), hit: false });
  return segments;
};

/** Pretty-prints a message that is a JSON object (structured app logs). */
export const prettyJson = (message: string): string | null => {
  const trimmed = message.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return null;
  }
};

/** `datetime-local` value (viewer's local time) -> UTC `YYYY-MM-DDTHH:mm`. */
export const localInputToUtc = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString().slice(0, 16);
};

export const JOURNAL_PRIORITIES = [
  { value: 0, title: '0 emerg' },
  { value: 1, title: '1 alert' },
  { value: 2, title: '2 crit' },
  { value: 3, title: '3 err' },
  { value: 4, title: '4 warning' },
  { value: 5, title: '5 notice' },
  { value: 6, title: '6 info' },
  { value: 7, title: '7 debug' },
];

export const formatPercent = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? '-'
    : `${Math.round(value * 10) / 10}%`;

/** `3 hari 4 jam`, `12 menit`, `40 dtk`. */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return '-';
  if (seconds < 60) return `${Math.round(seconds)} dtk`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} jam ${minutes % 60} menit`;
  return `${Math.floor(hours / 24)} hari ${hours % 24} jam`;
};

/** Bar/value color for a usage percentage. */
export const usageTone = (
  percent: number | null | undefined,
  warning = 70,
  error = 85,
): 'error' | 'warning' | 'success' | undefined => {
  if (percent === null || percent === undefined) return undefined;
  if (percent > error) return 'error';
  if (percent > warning) return 'warning';
  return 'success';
};

/** Service name without its stack prefix (`enem-landing_enem-landing-api` -> `enem-landing-api`). */
export const shortServiceName = (service: string, stack: string): string =>
  stack && service.startsWith(`${stack}_`)
    ? service.slice(stack.length + 1)
    : service;

export type DisplayZone = 'local' | 'UTC' | 'Asia/Jakarta';

/** Like formatDateTime, in a chosen time zone (log viewer setting). */
export const formatInZone = (
  iso: string | null | undefined,
  zone: DisplayZone,
): string => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(zone === 'local' ? {} : { timeZone: zone }),
  });
};

/** Viewer state keys in the URL (deep links). */
export const VIEWER_QUERY_KEYS = [
  'file',
  'before',
  'hl',
  'q',
  'stream',
  'limit',
];

/** A route query without `keys` and without empty values. */
export const cleanQuery = (
  query: Record<string, unknown>,
  keys: string[] = [],
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] =>
        !keys.includes(entry[0]) &&
        typeof entry[1] === 'string' &&
        entry[1] !== '',
    ),
  );
