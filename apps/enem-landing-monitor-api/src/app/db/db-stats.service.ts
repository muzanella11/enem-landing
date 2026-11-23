import type {
  MysqlSizes,
  MysqlStats,
  SlowQueryPattern,
} from '@enem-landing/shared-types';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { databaseUrlMonitor } from '../monitor.config.js';

const STATUS_KEYS = [
  'Uptime',
  'Threads_connected',
  'Threads_running',
  'Max_used_connections',
  'Slow_queries',
  'Aborted_connects',
  'Questions',
];
const VARIABLE_KEYS = ['max_connections', 'innodb_buffer_pool_size'];

const toNumber = (value: unknown): number | null => {
  const number = Number(value);
  return value === undefined || value === null || !Number.isFinite(number)
    ? null
    : number;
};

/** `SHOW ... STATUS/VARIABLES` rows -> name -> value. */
export const rowsToMap = (rows: RowDataPacket[]): Record<string, string> =>
  Object.fromEntries(
    rows.map((row) => [String(row['Variable_name']), String(row['Value'])]),
  );

/**
 * Server-level MySQL numbers through the `enem_monitor` user,
 * which only has PROCESS + USAGE: it can read status, variables and the
 * process list, but no table of any application database. Table sizes
 * come from the log-reader (file sizes in the data directory) instead of
 * `information_schema`.
 */
@Injectable()
export class DbStatsService implements OnModuleDestroy {
  private pool: Pool | null = null;

  constructor(private readonly reader: LogReaderClient) {}

  configured(): boolean {
    return databaseUrlMonitor().startsWith('mysql://');
  }

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = createPool({
        uri: databaseUrlMonitor(),
        connectionLimit: 2,
        connectTimeout: 5000,
        enableKeepAlive: true,
      });
    }
    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end().catch(() => undefined);
  }

  async ping(): Promise<void> {
    await this.getPool().query('SELECT 1');
  }

  async stats(): Promise<MysqlStats> {
    const empty: MysqlStats = {
      connected: false,
      uptimeSeconds: null,
      threadsConnected: null,
      threadsRunning: null,
      maxConnections: null,
      maxUsedConnections: null,
      slowQueries: null,
      abortedConnects: null,
      questions: null,
      innodbBufferPoolSize: null,
      longRunning: [],
    };
    if (!this.configured()) {
      return {
        ...empty,
        error: 'DATABASE_URL_MONITOR is not set in this environment',
      };
    }
    try {
      const pool = this.getPool();
      const [statusRows] = await pool.query<RowDataPacket[]>(
        'SHOW GLOBAL STATUS WHERE Variable_name IN (?)',
        [STATUS_KEYS],
      );
      const [variableRows] = await pool.query<RowDataPacket[]>(
        'SHOW GLOBAL VARIABLES WHERE Variable_name IN (?)',
        [VARIABLE_KEYS],
      );
      const [processRows] = await pool.query<RowDataPacket[]>(
        'SHOW FULL PROCESSLIST',
      );
      const status = rowsToMap(statusRows);
      const variables = rowsToMap(variableRows);
      return {
        connected: true,
        uptimeSeconds: toNumber(status['Uptime']),
        threadsConnected: toNumber(status['Threads_connected']),
        threadsRunning: toNumber(status['Threads_running']),
        maxConnections: toNumber(variables['max_connections']),
        maxUsedConnections: toNumber(status['Max_used_connections']),
        slowQueries: toNumber(status['Slow_queries']),
        abortedConnects: toNumber(status['Aborted_connects']),
        questions: toNumber(status['Questions']),
        innodbBufferPoolSize: toNumber(variables['innodb_buffer_pool_size']),
        longRunning: processRows
          .filter(
            (row) =>
              Number(row['Time']) >= 1 &&
              row['Command'] !== 'Sleep' &&
              row['Command'] !== 'Daemon' &&
              row['Info'] !== null &&
              !String(row['Info']).startsWith('SHOW FULL PROCESSLIST'),
          )
          .slice(0, 50)
          .map((row) => ({
            id: Number(row['Id']),
            user: String(row['User'] ?? ''),
            host: String(row['Host'] ?? ''),
            db:
              row['db'] === null || row['db'] === undefined
                ? null
                : String(row['db']),
            command: String(row['Command'] ?? ''),
            time: Number(row['Time']),
            state:
              row['State'] === null || row['State'] === undefined
                ? null
                : String(row['State']),
            info:
              row['Info'] === null ? null : String(row['Info']).slice(0, 2000),
          })),
      };
    } catch (error) {
      return {
        ...empty,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  sizes(): Promise<MysqlSizes> {
    return this.reader.get<MysqlSizes>('/mysql/sizes');
  }

  slowPatterns(): Promise<{
    patterns: SlowQueryPattern[];
    entries: number;
    truncated: boolean;
  }> {
    return this.reader.get('/mysql/slow-patterns');
  }
}
