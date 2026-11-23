import { parseContainerLine } from './container-log.js';

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const ISO_PREFIX =
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/;
const SYSLOG_PREFIX =
  /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s/;

/**
 * Timestamp at the start of a host log line, in ms, or `null`:
 * - RFC 3339 (`2026-11-23T10:00:00.123456+07:00`, rsyslog on Ubuntu 24.04,
 *   also apt/dpkg `2026-11-23 10:00:00`, read as UTC);
 * - classic syslog (`Nov 23 10:00:00`): no year, so the current year is
 *   assumed (last year if that lands more than a day in the future), UTC.
 */
export const parseLineTime = (
  line: string,
  now = Date.now(),
): number | null => {
  const iso = ISO_PREFIX.exec(line);
  if (iso) {
    let text = iso[1].replace(' ', 'T');
    if (!/(Z|[+-]\d{2}:?\d{2})$/.test(text)) text += 'Z';
    const value = Date.parse(text);
    return Number.isNaN(value) ? null : value;
  }
  const syslog = SYSLOG_PREFIX.exec(line);
  if (syslog) {
    const month = MONTHS[syslog[1]];
    if (month === undefined) return null;
    const year = new Date(now).getUTCFullYear();
    const build = (y: number) =>
      Date.UTC(
        y,
        month,
        Number(syslog[2]),
        Number(syslog[3]),
        Number(syslog[4]),
        Number(syslog[5]),
      );
    const value = build(year);
    return value > now + 86_400_000 ? build(year - 1) : value;
  }
  return null;
};

/** Time of a Docker json-file line (`"time":"..."`). */
export const parseContainerLineTime = (line: string): number | null => {
  const time = parseContainerLine(line).time;
  if (!time) return null;
  const value = Date.parse(time);
  return Number.isNaN(value) ? null : value;
};
