import type { ContactClientSignals } from '@enem-landing/shared-definitions';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import mailchecker from 'mailchecker';
import moment from 'moment-timezone';
import { resolveMx } from 'node:dns/promises';
import { Repository } from 'typeorm';
import { lookupGeo } from '../../tracking/geo-lookup.js';
import { TrackingSessionEntity } from '../../tracking/tracking-session.entity.js';
import type { ContactSubmissionSenderEntity } from '../contact-submission-sender.entity.js';
import { TorExitListService } from './tor-exit-list.service.js';

/** Request details the BFF forwards with a submission. */
export interface ContactRequestContext {
  ip: string | null;
  userAgent?: string;
  acceptLanguage?: string;
  referer?: string;
  /** Cloudflare `CF-IPCountry` (two-letter code). */
  cfCountry?: string;
  /** Cloudflare visitor location headers, when enabled on the zone. */
  cfRegion?: string;
  cfCity?: string;
  cfRay?: string;
}

export type SenderDetails = Omit<
  ContactSubmissionSenderEntity,
  'id' | 'submissionId' | 'submission' | 'createdAt'
>;

const MX_TIMEOUT_MS = 3000;
/** Cloudflare's codes for unknown and Tor traffic, not real countries. */
const NON_COUNTRY_CODES = new Set(['XX', 'T1']);

const clip = (value: string | undefined | null, max: number): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms).unref(),
    ),
  ]);

/** True when the domain or any parent domain is a known throwaway. */
export const isDisposableDomain = (domain: string): boolean => {
  const blacklist = mailchecker.blacklist();
  const labels = domain.toLowerCase().split('.');
  return labels.some((_, index) =>
    blacklist.has(labels.slice(index).join('.')),
  );
};

/** Null when the browser timezone or country is unknown. */
export const timezoneMismatch = (
  timezone: string | null,
  countryCode: string | null,
): boolean | null => {
  if (!timezone || !countryCode) return null;
  const zones = moment.tz.zonesForCountry(countryCode.toUpperCase());
  if (!zones || zones.length === 0) return null;
  return !zones.includes(timezone);
};

/**
 * Builds the sender record for a submission: request headers, browser
 * signals and a few lookups (IP reputation, Tor list, MX record, phone
 * metadata). Every lookup is best-effort; a failure leaves its column null.
 */
@Injectable()
export class ContactSenderEnrichmentService {
  constructor(
    private readonly torExitList: TorExitListService,
    @InjectRepository(TrackingSessionEntity)
    private readonly sessionRepository: Repository<TrackingSessionEntity>,
  ) {}

  async enrich(
    context: ContactRequestContext,
    email: string,
    phoneNumber: string,
    client: ContactClientSignals = {},
  ): Promise<SenderDetails> {
    const domain = email.split('@')[1] ?? '';
    const [geo, isTor, emailHasMx, hasTrackedVisit] = await Promise.all([
      lookupGeo(context.ip),
      this.torExitList.isTorExit(context.ip),
      this.checkMx(domain),
      this.checkTrackedVisit(client.visitorId),
    ]);

    const rawCountry = clip(context.cfCountry, 2)?.toUpperCase() ?? null;
    const countryCode =
      rawCountry && !NON_COUNTRY_CODES.has(rawCountry) ? rawCountry : null;
    const phone = parsePhoneNumberFromString(phoneNumber, 'ID');
    const timezone = clip(client.timezone, 64);

    return {
      ipAddress: clip(context.ip, 45),
      countryCode,
      country: clip(geo.country, 100),
      region: clip(context.cfRegion, 100) ?? clip(geo.region, 100),
      city: clip(context.cfCity, 100) ?? clip(geo.city, 100),
      cfRay: clip(context.cfRay, 64),
      asn: clip(geo.asn, 150),
      isp: clip(geo.isp, 150),
      org: clip(geo.org, 150),
      isProxy: geo.isProxy,
      isHosting: geo.isHosting,
      isTor: isTor ?? (rawCountry === 'T1' ? true : null),
      userAgent: clip(context.userAgent, 512),
      acceptLanguage: clip(context.acceptLanguage, 255),
      referer: clip(context.referer, 512),
      timezone,
      timezoneMismatch: timezoneMismatch(timezone, countryCode),
      language: clip(client.language, 35),
      screenWidth: client.screenWidth ?? null,
      screenHeight: client.screenHeight ?? null,
      fillDurationMs: client.fillDurationMs ?? null,
      keystrokeCount: client.keystrokeCount ?? null,
      pastedFields: client.pastedFields?.length ? client.pastedFields : null,
      hadPointerMovement: client.hadPointerMovement ?? null,
      visitorId: clip(client.visitorId, 64),
      sessionId: clip(client.sessionId, 64),
      hasTrackedVisit,
      emailHasMx,
      isDisposableEmail: domain ? isDisposableDomain(domain) : null,
      phoneCountry: phone?.country ?? null,
      phoneValid: phone ? phone.isValid() : false,
    };
  }

  private async checkMx(domain: string): Promise<boolean | null> {
    if (!domain) return null;
    try {
      const records = await withTimeout(resolveMx(domain), MX_TIMEOUT_MS);
      return records.length > 0;
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Definitive "this domain can't receive mail"; anything else
      // (timeout, resolver down) is unknown.
      return code === 'ENOTFOUND' || code === 'ENODATA' ? false : null;
    }
  }

  private async checkTrackedVisit(visitorId?: string): Promise<boolean | null> {
    if (!visitorId) return null;
    try {
      return (await this.sessionRepository.count({ where: { visitorId } })) > 0;
    } catch {
      return null;
    }
  }
}
