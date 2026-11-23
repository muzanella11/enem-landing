import type { RedisSlowlogEntry } from '@enem-landing/shared-types';

/** `SLOWLOG GET` rows: [id, unix seconds, micros, [args...], client addr, client name]. */
export const parseSlowlog = (raw: unknown[]): RedisSlowlogEntry[] =>
  raw.filter(Array.isArray).map((row) => {
    const [id, seconds, micros, args, client, clientName] = row as unknown[];
    const command = Array.isArray(args) ? args.map(String) : [];
    // AUTH arguments (and anything after it) never leave this service.
    const authIndex = command.findIndex((arg) => arg.toUpperCase() === 'AUTH');
    const safe =
      authIndex === -1 ? command : [...command.slice(0, authIndex + 1), '***'];
    return {
      id: Number(id),
      time: new Date(Number(seconds) * 1000).toISOString(),
      durationMicros: Number(micros),
      command: safe.join(' ').slice(0, 2000),
      client: String(client ?? ''),
      clientName: String(clientName ?? ''),
    };
  });
