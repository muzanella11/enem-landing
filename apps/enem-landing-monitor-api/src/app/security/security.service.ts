import type {
  KnownIp,
  SecuritySummary,
  SuccessfulLogin,
} from '@enem-landing/shared-types';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { isIP } from 'node:net';
import { LogReaderClient } from '../logs/log-reader.client.js';
import { MonitorStore } from '../store/monitor-store.js';

interface Geo {
  country: string | null;
  countryCode: string | null;
  asn: string | null;
}

const GEO_TTL_SECONDS = 7 * 86_400;
const KNOWN_TTL_SECONDS = 365 * 86_400;
/** ip-api.com free batch: 100 IPs a request, 15 requests a minute. */
const GEO_BATCH = 100;

const isPublicIp = (ip: string): boolean =>
  isIP(ip) !== 0 &&
  !/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/i.test(
    ip,
  );

/**
 * Login analysis. The log-reader aggregates btmp/wtmp/auth.log
 * (it has no internet access); this adds the country/ASN from ip-api.com
 * (the same free service enem-landing-api's geo-lookup uses, here through
 * its batch endpoint) cached 7 days, and the "known IP" flag. Known IPs
 * are host data, shared by prod and dev.
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly reader: LogReaderClient,
    private readonly store: MonitorStore,
  ) {}

  private get knownKey() {
    return this.store.shared('known-ips');
  }

  async knownIps(): Promise<KnownIp[]> {
    const known = await this.store.hashJson<Omit<KnownIp, 'ip'>>(this.knownKey);
    return Object.entries(known)
      .map(([ip, value]) => ({ ip, ...value }))
      .sort((a, b) => a.ip.localeCompare(b.ip));
  }

  async addKnownIp(ip: string, label: string, auto = false): Promise<void> {
    if (isIP(ip) === 0) throw new BadRequestException('Invalid IP address');
    const value: Omit<KnownIp, 'ip'> = {
      label: label.trim().slice(0, 60),
      addedAt: new Date().toISOString(),
      auto,
    };
    await this.store.client.hset(this.knownKey, ip, JSON.stringify(value));
    await this.store.client.expire(this.knownKey, KNOWN_TTL_SECONDS);
  }

  async removeKnownIp(ip: string): Promise<void> {
    if (isIP(ip) === 0) throw new BadRequestException('Invalid IP address');
    await this.store.client.hdel(this.knownKey, ip);
  }

  async recentLogins(hours: number): Promise<SuccessfulLogin[]> {
    return this.reader.get<SuccessfulLogin[]>('/security/logins', {
      hours: String(hours),
    });
  }

  async summary(hours: number): Promise<SecuritySummary> {
    const summary = await this.reader.get<SecuritySummary>(
      '/security/summary',
      {
        hours: String(hours),
      },
    );
    const known = new Map(
      (await this.knownIps()).map((entry) => [entry.ip, entry]),
    );
    const geo = await this.lookup([
      ...summary.topIps.map((entry) => entry.ip),
      ...summary.logins.map((login) => login.ip),
    ]);
    return {
      ...summary,
      topIps: summary.topIps.map((entry) => ({
        ...entry,
        country: geo.get(entry.ip)?.country ?? null,
        countryCode: geo.get(entry.ip)?.countryCode ?? null,
        asn: geo.get(entry.ip)?.asn ?? null,
      })),
      logins: summary.logins.map((login) => ({
        ...login,
        known: known.has(login.ip),
        knownLabel: known.get(login.ip)?.label ?? null,
      })),
    };
  }

  /** Country and ASN per IP, from the Redis cache or one ip-api batch. */
  async lookup(ips: string[]): Promise<Map<string, Geo>> {
    const unique = [...new Set(ips.filter(isPublicIp))];
    const result = new Map<string, Geo>();
    if (!unique.length) return result;
    const cached = await this.store.client.mget(
      ...unique.map((ip) => this.store.shared(`geo:${ip}`)),
    );
    const missing: string[] = [];
    unique.forEach((ip, index) => {
      const raw = cached[index];
      if (raw) {
        try {
          result.set(ip, JSON.parse(raw) as Geo);
          return;
        } catch {
          // fall through
        }
      }
      missing.push(ip);
    });
    if (!missing.length) return result;
    try {
      const response = await fetch(
        'http://ip-api.com/batch?fields=status,country,countryCode,as,query',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(missing.slice(0, GEO_BATCH)),
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!response.ok) throw new Error(`ip-api ${response.status}`);
      const rows = (await response.json()) as Array<{
        status: string;
        country?: string;
        countryCode?: string;
        as?: string;
        query: string;
      }>;
      for (const row of rows) {
        if (row.status !== 'success') continue;
        const geo: Geo = {
          country: row.country ?? null,
          countryCode: row.countryCode ?? null,
          asn: row.as ?? null,
        };
        result.set(row.query, geo);
        await this.store.setJson(
          this.store.shared(`geo:${row.query}`),
          geo,
          GEO_TTL_SECONDS,
        );
      }
    } catch (error) {
      this.logger.warn(`geo lookup failed: ${String(error)}`);
    }
    return result;
  }
}
