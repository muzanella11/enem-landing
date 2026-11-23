import type { SlowQueryPattern } from '@enem-landing/shared-types';
import { createSlowLogTransform } from '../readers/mysql-slow.js';
import { tailFile } from '../readers/tail-reader.js';

/**
 * Normalizes a query to its pattern: literals become `?`, `IN (?, ?, ?)`
 * becomes `IN (?+)`, `use db;` and comments go, whitespace collapses. Same
 * idea as `pt-query-digest`'s fingerprint, simpler.
 */
export const fingerprint = (query: string): string =>
  query
    .replace(/^\s*use\s+[`\w]+;\s*/i, '')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/'(?:[^'\\]|\\.|'')*'/g, '?')
    .replace(/"(?:[^"\\]|\\.|"")*"/g, '?')
    .replace(/\b0x[0-9a-f]+\b/gi, '?')
    .replace(/(?<![\w`])-?\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/gi, '?')
    .replace(/\(\s*\?(?:\s*,\s*\?)+\s*\)/g, '(?+)')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;$/, '')
    .slice(0, 1000);

/** Groups the newest part of `slow.log` (up to 32 MB) by pattern. */
export const readSlowPatterns = async (
  path: string,
  compressed: boolean,
  deadline: number,
): Promise<{
  patterns: SlowQueryPattern[];
  entries: number;
  truncated: boolean;
}> => {
  const groups = new Map<string, SlowQueryPattern>();
  let entries = 0;
  const page = await tailFile(path, compressed, {
    limit: 1_000_000,
    deadline,
    transform: (() => {
      const parse = createSlowLogTransform(() => true);
      return (line: string) => {
        const entry = parse(line);
        if (!entry || !entry.query) return null;
        entries += 1;
        const key = fingerprint(entry.query);
        const group = groups.get(key);
        if (group) {
          group.count += 1;
          group.totalTime += entry.queryTime;
          group.maxTime = Math.max(group.maxTime, entry.queryTime);
          group.rowsExamined += entry.rowsExamined;
          if (entry.time > group.lastSeen) group.lastSeen = entry.time;
        } else if (groups.size < 2000) {
          groups.set(key, {
            pattern: key,
            count: 1,
            totalTime: entry.queryTime,
            avgTime: 0,
            maxTime: entry.queryTime,
            lastSeen: entry.time,
            rowsExamined: entry.rowsExamined,
          });
        }
        return null;
      };
    })(),
  });
  const patterns = [...groups.values()]
    .map((group) => ({
      ...group,
      totalTime: Math.round(group.totalTime * 1000) / 1000,
      avgTime: Math.round((group.totalTime / group.count) * 1000) / 1000,
    }))
    .sort((a, b) => b.totalTime - a.totalTime)
    .slice(0, 100);
  return { patterns, entries, truncated: page.truncated };
};
