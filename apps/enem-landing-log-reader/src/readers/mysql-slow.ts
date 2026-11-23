import type { MysqlSlowEntry } from '@enem-landing/shared-types';
import type { LineTransform } from './tail-reader.js';

/** Lines MySQL writes when the slow log (re)opens; never part of an entry. */
const HEADER_LINE =
  /^(\S+, Version: |Tcp port: |Time\s+Id\s+Command\s+Argument)/;

const number = (text: string, key: string): number => {
  const match = new RegExp(`${key}:\\s*([\\d.]+)`).exec(text);
  return match ? Number(match[1]) : 0;
};

/** Parses one entry's lines (oldest first). */
export const parseSlowEntry = (lines: string[]): MysqlSlowEntry => {
  const entry: MysqlSlowEntry = {
    time: '',
    user: '',
    host: '',
    queryTime: 0,
    lockTime: 0,
    rowsSent: 0,
    rowsExamined: 0,
    query: '',
  };
  const query: string[] = [];
  for (const line of lines) {
    if (line.startsWith('# Time:')) {
      entry.time = line.slice('# Time:'.length).trim();
    } else if (line.startsWith('# User@Host:')) {
      const rest = line.slice('# User@Host:'.length);
      entry.user = rest.split('[')[0].trim();
      const hostPart = rest.split('@').slice(1).join('@');
      const bracket = /\[([^\]]*)\]/.exec(hostPart);
      entry.host = (
        hostPart.split('[')[0].trim() ||
        bracket?.[1] ||
        ''
      ).replace(/\s*Id:.*$/, '');
    } else if (line.startsWith('# Query_time:')) {
      entry.queryTime = number(line, 'Query_time');
      entry.lockTime = number(line, 'Lock_time');
      entry.rowsSent = number(line, 'Rows_sent');
      entry.rowsExamined = number(line, 'Rows_examined');
    } else if (
      line.startsWith('#') ||
      /^SET timestamp=\d+;$/.test(line) ||
      HEADER_LINE.test(line)
    ) {
      continue;
    } else {
      query.push(line);
    }
  }
  entry.query = query.join('\n').trim();
  return entry;
};

/**
 * Stateful transform for the backwards tail reader: lines arrive newest
 * first, so they are buffered until the `# Time:` line that opens the
 * entry, then the whole entry is emitted.
 */
export const createSlowLogTransform = (
  match: (text: string) => boolean,
): LineTransform<MysqlSlowEntry> => {
  let buffered: string[] = [];
  return (line) => {
    if (HEADER_LINE.test(line)) return null;
    buffered.push(line);
    if (!line.startsWith('# Time:')) return null;
    const entry = parseSlowEntry(buffered.reverse());
    buffered = [];
    return match(`${entry.user} ${entry.host} ${entry.query}`) ? entry : null;
  };
};
