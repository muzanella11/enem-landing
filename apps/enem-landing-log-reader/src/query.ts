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
