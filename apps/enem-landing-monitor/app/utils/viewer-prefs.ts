import type { DisplayZone } from './log-format';

/**
 * Per-browser viewer preferences: saved filters and display
 * time zone. Not important data, so only localStorage, and every access is
 * wrapped: a browser that blocks storage simply gets no saved filters.
 */
export interface SavedFilter {
  name: string;
  q: string;
  stream: '' | 'stdout' | 'stderr';
}

const FILTERS_KEY = 'enem-monitor:saved-filters';
const ZONE_KEY = 'enem-monitor:time-zone';

const read = (key: string): string | null => {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const write = (key: string, value: string): boolean => {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const loadSavedFilters = (): SavedFilter[] => {
  try {
    const parsed = JSON.parse(read(FILTERS_KEY) ?? '[]') as unknown;
    return Array.isArray(parsed)
      ? parsed
          .filter(
            (item): item is SavedFilter =>
              typeof item?.name === 'string' && typeof item?.q === 'string',
          )
          .slice(0, 30)
      : [];
  } catch {
    return [];
  }
};

export const storeSavedFilters = (filters: SavedFilter[]): boolean =>
  write(FILTERS_KEY, JSON.stringify(filters.slice(0, 30)));

export const loadZone = (): DisplayZone => {
  const value = read(ZONE_KEY);
  return value === 'UTC' || value === 'Asia/Jakarta' ? value : 'local';
};

export const storeZone = (zone: DisplayZone): boolean => write(ZONE_KEY, zone);

/** ISO time at the start of a host log line, for "open timeline here". */
export const lineIsoTime = (line: string): string | null => {
  const match =
    /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/.exec(
      line,
    );
  if (!match) return null;
  const value = Date.parse(match[1]);
  return Number.isNaN(value) ? null : new Date(value).toISOString();
};
