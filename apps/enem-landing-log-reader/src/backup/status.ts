import type {
  BackupRun,
  BackupStatus,
  JournalEntry,
} from '@enem-landing/shared-types';
import { readJournal } from '../journal/journal.js';

const SUCCESS = /^Backup (\S+) done$/;
const FAILURE = /MySQL backup FAILED|Failed with result/;

/**
 * Backup runs from the journal of `mysql-backup.service` (the backups
 * themselves go straight to R2, nothing is kept on the VPS). A run is a
 * `Backup <stamp> done` line or a failure line; failures less than two
 * minutes apart (the script's own message plus systemd's) count once.
 */
export const backupRunsFromJournal = (entries: JournalEntry[]): BackupRun[] => {
  const runs: BackupRun[] = [];
  for (const entry of entries) {
    const message = entry.message.trim();
    if (SUCCESS.test(message)) {
      runs.push({ time: entry.time, ok: true, message });
    } else if (FAILURE.test(message)) {
      const previous = runs[runs.length - 1];
      if (
        previous &&
        !previous.ok &&
        Math.abs(Date.parse(entry.time) - Date.parse(previous.time)) < 120_000
      ) {
        if (/MySQL backup FAILED/.test(message)) previous.message = message;
        continue;
      }
      runs.push({ time: entry.time, ok: false, message });
    }
  }
  return runs.sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
};

export const readBackupStatus = async (
  bin: string,
  directory: string,
  timeoutMs: number,
): Promise<BackupStatus> => {
  const since = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 19);
  let entries: JournalEntry[];
  try {
    entries = (
      await readJournal(
        bin,
        directory,
        { unit: 'mysql-backup.service', since, limit: 1000 },
        timeoutMs,
      )
    ).entries;
  } catch {
    return {
      lastSuccessAt: null,
      lastFailureAt: null,
      lastRun: null,
      runs: [],
      available: false,
    };
  }
  const runs = backupRunsFromJournal(entries);
  return {
    lastSuccessAt: runs.find((run) => run.ok)?.time ?? null,
    lastFailureAt: runs.find((run) => !run.ok)?.time ?? null,
    lastRun: runs[0] ?? null,
    runs: runs.slice(0, 30),
    available: entries.length > 0,
  };
};
