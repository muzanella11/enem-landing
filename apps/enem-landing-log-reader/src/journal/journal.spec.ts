import { describe, expect, it } from 'vitest';
import {
  buildJournalArgs,
  CURSOR_PATTERN,
  parseJournalLine,
  UNIT_PATTERN,
} from './journal.js';

describe('journal', () => {
  it('builds arguments without a shell and escapes the search', () => {
    const args = buildJournalArgs('/host/var/log/journal', {
      unit: 'ssh.service',
      priority: 3,
      since: '2026-11-23T10:00',
      until: '2026-11-23T11:00:30',
      limit: 100,
      q: 'a.b*',
    });
    expect(args).toContain('--unit=ssh.service');
    expect(args).toContain('--priority=3');
    expect(args).toContain('--since=2026-11-23 10:00:00 UTC');
    expect(args).toContain('--until=2026-11-23 11:00:30 UTC');
    expect(args).toContain('--grep=a\\.b\\*');
    expect(args).toContain('--directory=/host/var/log/journal');
  });

  it('rejects units and cursors that could be flags or paths', () => {
    expect(UNIT_PATTERN.test('--directory=/etc')).toBe(false);
    expect(UNIT_PATTERN.test('ssh.service')).toBe(true);
    expect(CURSOR_PATTERN.test('s=1;i=2 --root=/')).toBe(false);
  });

  it('parses a journal JSON line, including byte-array messages', () => {
    const entry = parseJournalLine(
      JSON.stringify({
        __CURSOR: 's=1;i=2',
        __REALTIME_TIMESTAMP: '1795000000000000',
        PRIORITY: '3',
        _SYSTEMD_UNIT: 'ssh.service',
        SYSLOG_IDENTIFIER: 'sshd',
        _PID: '42',
        MESSAGE: [104, 105],
      }),
    );
    expect(entry).toEqual({
      cursor: 's=1;i=2',
      time: new Date(1795000000000).toISOString(),
      priority: 3,
      unit: 'ssh.service',
      identifier: 'sshd',
      pid: '42',
      message: 'hi',
    });
  });
});
