import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { MysqlSizes, MysqlTableSize } from '@enem-landing/shared-types';
import { isPlainName } from '../paths.js';

/** Schemas MySQL owns itself; still counted in the total, not listed. */
const SYSTEM_SCHEMAS = new Set(['mysql', 'sys', 'performance_schema']);

/** `my@002ddb` -> `my-db` (MySQL's file name encoding for special characters). */
export const decodeMysqlName = (name: string): string =>
  name.replace(/@([0-9a-f]{4})/g, (_match, hex: string) =>
    String.fromCharCode(parseInt(hex, 16)),
  );

const safeList = async (dir: string): Promise<string[]> => {
  try {
    return (await readdir(dir)).filter(isPlainName);
  } catch {
    return [];
  }
};

/**
 * Database and table sizes from the data directory: one folder per
 * database, one `<table>.ibd` per InnoDB table. Only `readdir` and
 * `lstat`: no file is opened, so the reader never sees row data, and the
 * monitor's MySQL user needs no access to `information_schema`.
 */
export const readMysqlSizes = async (dataDir: string): Promise<MysqlSizes> => {
  let totalBytes = 0;
  const databases: MysqlSizes['databases'] = [];
  const tables: MysqlTableSize[] = [];

  for (const name of await safeList(dataDir)) {
    const path = join(dataDir, name);
    let stats;
    try {
      stats = await lstat(path);
    } catch {
      continue;
    }
    if (stats.isFile()) {
      totalBytes += stats.size;
      continue;
    }
    if (!stats.isDirectory()) continue;

    let dbBytes = 0;
    let tableCount = 0;
    for (const file of await safeList(path)) {
      try {
        const fileStats = await lstat(join(path, file));
        if (!fileStats.isFile()) continue;
        dbBytes += fileStats.size;
        if (file.endsWith('.ibd')) {
          tableCount += 1;
          if (!name.startsWith('#') && !SYSTEM_SCHEMAS.has(name)) {
            tables.push({
              database: decodeMysqlName(name),
              table: decodeMysqlName(file.slice(0, -'.ibd'.length)),
              bytes: fileStats.size,
            });
          }
        }
      } catch {
        // Dropped or rotated between readdir and lstat.
      }
    }
    totalBytes += dbBytes;
    if (!name.startsWith('#') && !SYSTEM_SCHEMAS.has(name)) {
      databases.push({
        name: decodeMysqlName(name),
        bytes: dbBytes,
        tables: tableCount,
      });
    }
  }

  databases.sort((a, b) => b.bytes - a.bytes);
  tables.sort((a, b) => b.bytes - a.bytes);
  return { totalBytes, databases, topTables: tables.slice(0, 30) };
};
