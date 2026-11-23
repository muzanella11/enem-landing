import type { ContainerStream } from '@enem-landing/shared-types';
import { HttpError } from './errors.js';
import { MAX_ENTRIES } from './limits.js';

const INTEGER = /^\d{1,15}$/;

export const optionalInt = (
  params: URLSearchParams,
  name: string,
  min: number,
  max: number,
): number | undefined => {
  const raw = params.get(name);
  if (raw === null || raw === '') return undefined;
  if (!INTEGER.test(raw))
    throw new HttpError(400, `${name} must be an integer`);
  const value = Number(raw);
  if (value < min || value > max)
    throw new HttpError(400, `${name} must be between ${min} and ${max}`);
  return value;
};

export const limitParam = (params: URLSearchParams): number =>
  optionalInt(params, 'limit', 1, MAX_ENTRIES) ?? 100;

export const fileIndexParam = (params: URLSearchParams): number =>
  optionalInt(params, 'file', 0, 99) ?? 0;

export const beforeParam = (params: URLSearchParams): number | undefined =>
  optionalInt(params, 'before', 0, Number.MAX_SAFE_INTEGER);

/** Free-text search, case-insensitive substring. */
export const searchParam = (params: URLSearchParams): string | undefined => {
  const raw = params.get('q');
  if (raw === null) return undefined;
  const value = raw.trim();
  if (value.length > 200)
    throw new HttpError(400, 'q must be at most 200 characters');
  if (value.includes('\0'))
    throw new HttpError(400, 'q contains invalid characters');
  return value || undefined;
};

export const streamParam = (
  params: URLSearchParams,
): ContainerStream | undefined => {
  const raw = params.get('stream');
  if (raw === null || raw === '') return undefined;
  if (raw !== 'stdout' && raw !== 'stderr')
    throw new HttpError(400, 'stream must be stdout or stderr');
  return raw;
};

export const patternParam = (
  params: URLSearchParams,
  name: string,
  pattern: RegExp,
): string | undefined => {
  const raw = params.get(name);
  if (raw === null || raw === '') return undefined;
  if (!pattern.test(raw))
    throw new HttpError(400, `${name} has an invalid format`);
  return raw;
};

/** ISO 8601 instant, e.g. `2026-11-23T10:00:00.000Z` or `2026-11-23T17:00+07:00`. */
export const ISO_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?$/;

export const timeParam = (params: URLSearchParams, name: string): number => {
  const raw = params.get(name);
  if (!raw || !ISO_TIME.test(raw))
    throw new HttpError(400, `${name} must be an ISO 8601 time`);
  const value = Date.parse(/(Z|[+-]\d{2}:\d{2})$/.test(raw) ? raw : `${raw}Z`);
  if (Number.isNaN(value))
    throw new HttpError(400, `${name} is not a valid time`);
  return value;
};

/** Container categories the timeline can be limited to (comma separated). */
export const CATEGORIES = [
  'apps-prod',
  'apps-dev',
  'db',
  'redis',
  'infra',
] as const;

export const categoriesParam = (
  params: URLSearchParams,
): Set<string> | null => {
  const raw = params.get('categories');
  if (!raw) return null;
  const values = raw.split(',').filter(Boolean);
  for (const value of values) {
    if (!(CATEGORIES as readonly string[]).includes(value))
      throw new HttpError(400, 'categories has an unknown value');
  }
  return new Set(values);
};

/** Swarm service name (`enem-landing_enem-landing-api`). */
export const serviceParam = (params: URLSearchParams): string | undefined =>
  patternParam(params, 'service', /^[A-Za-z0-9_.-]{1,128}$/);
