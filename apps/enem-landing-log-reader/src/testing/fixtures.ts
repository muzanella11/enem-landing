import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ReaderConfig } from '../config.js';
import { UTMP_RECORD_SIZE } from '../readers/utmp.js';

export const TOKEN = 'a'.repeat(40);
export const CONTAINER_ID = 'c'.repeat(64);
export const STOPPED_ID = 'd'.repeat(64);

export const utmpRecord = (options: {
  type: number;
  user: string;
  host: string;
  ip: number[];
  seconds: number;
}): Buffer => {
  const buffer = Buffer.alloc(UTMP_RECORD_SIZE);
  buffer.writeInt16LE(options.type, 0);
  buffer.writeInt32LE(1234, 4);
  buffer.write('ssh:notty', 8, 'utf8');
  buffer.write(options.user, 44, 'utf8');
  buffer.write(options.host, 76, 'utf8');
  buffer.writeInt32LE(options.seconds, 340);
  Buffer.from(options.ip).copy(buffer, 348);
  return buffer;
};

/** A fake host: /var/log, docker containers and mysql-logs in a temp dir. */
export const createHost = (): { root: string; config: ReaderConfig } => {
  const root = mkdtempSync(join(tmpdir(), 'log-reader-'));
  const varLog = join(root, 'var/log');
  const containers = join(root, 'docker/containers');
  const mysqlLogs = join(root, 'mysql-logs');
  mkdirSync(join(varLog, 'apt'), { recursive: true });
  mkdirSync(join(containers, CONTAINER_ID), { recursive: true });
  mkdirSync(join(containers, STOPPED_ID), { recursive: true });
  mkdirSync(mysqlLogs, { recursive: true });

  writeFileSync(
    join(varLog, 'auth.log'),
    'line one\nFailed password for root\nline three\n',
  );
  writeFileSync(join(varLog, 'auth.log.1'), 'older line\n');
  writeFileSync(join(varLog, 'apt/eipp.log.xz'), 'not really xz');
  writeFileSync(join(root, 'secret.txt'), 'top secret');
  const now = Math.floor(Date.now() / 1000);
  writeFileSync(
    join(varLog, 'btmp'),
    Buffer.concat([
      utmpRecord({
        type: 6,
        user: 'admin',
        host: '203.0.113.9',
        ip: [203, 0, 113, 9],
        seconds: now - 3 * 86400,
      }),
      utmpRecord({
        type: 6,
        user: 'root',
        host: '198.51.100.7',
        ip: [198, 51, 100, 7],
        seconds: now - 60,
      }),
    ]),
  );
  writeFileSync(
    join(containers, CONTAINER_ID, 'config.v2.json'),
    JSON.stringify({
      Name: '/enem-landing_enem-landing-api.1.abc',
      RestartCount: 0,
      State: {
        Running: true,
        StartedAt: new Date().toISOString(),
        FinishedAt: '0001-01-01T00:00:00Z',
        ExitCode: 0,
      },
      Config: {
        Labels: {
          'com.docker.stack.namespace': 'enem-landing',
          'com.docker.swarm.service.name': 'enem-landing_enem-landing-api',
        },
      },
    }),
  );
  writeFileSync(
    join(containers, CONTAINER_ID, `${CONTAINER_ID}-json.log`),
    [
      JSON.stringify({
        log: 'booting\n',
        stream: 'stdout',
        time: '2026-11-23T10:00:00Z',
      }),
      JSON.stringify({
        log: 'Error: boom\n',
        stream: 'stderr',
        time: '2026-11-23T10:00:01Z',
      }),
    ].join('\n') + '\n',
  );
  writeFileSync(
    join(containers, STOPPED_ID, 'config.v2.json'),
    JSON.stringify({
      Name: '/enem-landing_enem-landing-api.1.old',
      State: {
        Running: false,
        StartedAt: new Date(Date.now() - 7200_000).toISOString(),
        FinishedAt: new Date(Date.now() - 3600_000).toISOString(),
        ExitCode: 137,
        OOMKilled: true,
        Error: '',
      },
      Config: {
        Labels: {
          'com.docker.stack.namespace': 'enem-landing',
          'com.docker.swarm.service.name': 'enem-landing_enem-landing-api',
        },
      },
    }),
  );
  writeFileSync(join(containers, STOPPED_ID, `${STOPPED_ID}-json.log`), '');
  writeFileSync(
    join(mysqlLogs, 'slow.log'),
    [
      '/usr/sbin/mysqld, Version: 8.4.3 (MySQL Community Server - GPL). started with:',
      'Tcp port: 3306  Unix socket: /var/run/mysqld/mysqld.sock',
      'Time                 Id Command    Argument',
      '# Time: 2026-11-23T10:00:00.000000Z',
      '# User@Host: enem_prod[enem_prod] @  [10.0.1.5]  Id:    12',
      '# Query_time: 2.500000  Lock_time: 0.000100 Rows_sent: 1  Rows_examined: 100000',
      'use enem_landing_api;',
      'SET timestamp=1795000000;',
      'SELECT * FROM tracking_sessions;',
      '# Time: 2026-11-23T11:00:00.000000Z',
      '# User@Host: enem_dev[enem_dev] @ localhost []  Id:    13',
      '# Query_time: 1.100000  Lock_time: 0.000000 Rows_sent: 0  Rows_examined: 5',
      'SET timestamp=1795003600;',
      'DELETE FROM blog_posts',
      '  WHERE id = 1;',
      '',
    ].join('\n'),
  );

  return {
    root,
    config: {
      port: 0,
      varLogDir: varLog,
      journalDir: join(varLog, 'journal'),
      containersDir: containers,
      mysqlLogsDir: mysqlLogs,
      passwdFile: join(root, 'passwd'),
      journalctlBin: 'journalctl-does-not-exist',
      tokens: [TOKEN],
    },
  };
};
