import type { StoreClient } from './monitor-store.js';

/** In-memory stand-in for the ioredis commands MonitorStore uses (tests only). */
export class FakeRedis implements StoreClient {
  readonly strings = new Map<string, string>();
  readonly lists = new Map<string, string[]>();
  readonly hashes = new Map<string, Map<string, string>>();
  readonly ttls = new Map<string, number>();

  private list(key: string): string[] {
    let list = this.lists.get(key);
    if (!list) {
      list = [];
      this.lists.set(key, list);
    }
    return list;
  }

  async get(key: string) {
    return this.strings.get(key) ?? null;
  }

  async set(key: string, value: string, ...args: Array<string | number>) {
    if (args.includes('NX') && this.strings.has(key)) return null;
    this.strings.set(key, value);
    const ex = args.indexOf('EX');
    if (ex !== -1) this.ttls.set(key, Number(args[ex + 1]));
    return 'OK';
  }

  async del(...keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (
        this.strings.delete(key) ||
        this.lists.delete(key) ||
        this.hashes.delete(key)
      )
        count += 1;
    }
    return count;
  }

  async mget(...keys: string[]) {
    return keys.map((key) => this.strings.get(key) ?? null);
  }

  async expire(key: string, seconds: number) {
    this.ttls.set(key, seconds);
    return 1;
  }

  async append(key: string, value: string) {
    const next = (this.strings.get(key) ?? '') + value;
    this.strings.set(key, next);
    return next.length;
  }

  async lpush(key: string, ...values: string[]) {
    const list = this.list(key);
    for (const value of values) list.unshift(value);
    return list.length;
  }

  async lpop(key: string) {
    return this.list(key).shift() ?? null;
  }

  async rpop(key: string) {
    return this.list(key).pop() ?? null;
  }

  async lset(key: string, index: number, value: string) {
    const list = this.list(key);
    list[index < 0 ? list.length + index : index] = value;
    return 'OK';
  }

  async llen(key: string) {
    return this.list(key).length;
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.list(key);
    return list.slice(start, stop < 0 ? list.length + stop + 1 : stop + 1);
  }

  async ltrim(key: string, start: number, stop: number) {
    this.lists.set(key, await this.lrange(key, start, stop));
    return 'OK';
  }

  async lmove(
    source: string,
    destination: string,
    from: 'LEFT' | 'RIGHT',
    to: 'LEFT' | 'RIGHT',
  ) {
    const value =
      from === 'LEFT' ? this.list(source).shift() : this.list(source).pop();
    if (value === undefined) return null;
    if (to === 'LEFT') this.list(destination).unshift(value);
    else this.list(destination).push(value);
    return value;
  }

  async hgetall(key: string) {
    return Object.fromEntries(this.hashes.get(key) ?? new Map());
  }

  async hset(key: string, field: string, value: string) {
    let hash = this.hashes.get(key);
    if (!hash) {
      hash = new Map();
      this.hashes.set(key, hash);
    }
    const created = !hash.has(field);
    hash.set(field, value);
    return created ? 1 : 0;
  }

  async hdel(key: string, ...fields: string[]) {
    const hash = this.hashes.get(key);
    let count = 0;
    for (const field of fields) if (hash?.delete(field)) count += 1;
    return count;
  }
}
