import { describe, expect, it } from 'vitest';
import {
  exitCodeMeaning,
  formatBytes,
  highlightSegments,
  isRecentStart,
  localInputToUtc,
  prettyJson,
} from '../app/utils/log-format';

describe('log-format', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(30 * 1024 * 1024)).toBe('30 MB');
    expect(formatBytes(null)).toBe('-');
  });

  it('explains exit codes', () => {
    expect(exitCodeMeaning(0, false)).toContain('normal');
    expect(exitCodeMeaning(137, false)).toContain('SIGKILL');
    expect(exitCodeMeaning(137, true)).toContain('OOMKilled');
    expect(exitCodeMeaning(143, false)).toContain('SIGTERM');
  });

  it('flags containers started less than 5 minutes ago', () => {
    const now = Date.parse('2026-11-23T10:00:00Z');
    expect(isRecentStart('2026-11-23T09:57:00Z', now)).toBe(true);
    expect(isRecentStart('2026-11-23T09:50:00Z', now)).toBe(false);
    expect(isRecentStart(null, now)).toBe(false);
  });

  it('highlights keywords and the search term as plain text segments', () => {
    expect(highlightSegments('npm ERROR <script>x</script>', 'script')).toEqual([
      { text: 'npm ', hit: false },
      { text: 'ERROR', hit: true },
      { text: ' <', hit: false },
      { text: 'script', hit: true },
      { text: '>x</', hit: false },
      { text: 'script', hit: true },
      { text: '>', hit: false },
    ]);
  });

  it('pretty-prints JSON messages only', () => {
    expect(prettyJson('{"level":"info"}')).toBe('{\n  "level": "info"\n}');
    expect(prettyJson('plain text')).toBeNull();
  });

  it('converts a local datetime input to UTC', () => {
    expect(localInputToUtc('')).toBeUndefined();
    expect(localInputToUtc(new Date('2026-11-23T10:00:00Z').toISOString())).toBe('2026-11-23T10:00');
  });
});
