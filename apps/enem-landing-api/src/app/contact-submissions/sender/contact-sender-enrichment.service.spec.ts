import { beforeEach, describe, expect, it, vi } from 'vitest';

const lookupGeo = vi.fn();
const resolveMx = vi.fn();
vi.mock('../../tracking/geo-lookup.js', () => ({ lookupGeo }));
vi.mock('node:dns/promises', () => ({ resolveMx }));

const { ContactSenderEnrichmentService, isDisposableDomain, timezoneMismatch } =
  await import('./contact-sender-enrichment.service.js');

describe('ContactSenderEnrichmentService', () => {
  let tor: { isTorExit: ReturnType<typeof vi.fn> };
  let sessions: { count: ReturnType<typeof vi.fn> };
  let service: InstanceType<typeof ContactSenderEnrichmentService>;

  beforeEach(() => {
    lookupGeo.mockResolvedValue({
      country: 'Indonesia',
      region: 'Jakarta',
      city: 'Jakarta',
      latitude: null,
      longitude: null,
      isp: 'Telkomsel',
      org: 'Telkomsel',
      asn: 'AS23693',
      isProxy: false,
      isHosting: false,
    });
    resolveMx.mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]);
    tor = { isTorExit: vi.fn().mockResolvedValue(false) };
    sessions = { count: vi.fn().mockResolvedValue(2) };
    service = new ContactSenderEnrichmentService(
      tor as never,
      sessions as never,
    );
  });

  it('combines headers, browser signals and lookups', async () => {
    const details = await service.enrich(
      {
        ip: '203.0.113.7',
        userAgent: 'Mozilla/5.0',
        acceptLanguage: 'id-ID',
        referer: 'https://muzanella.com/',
        cfCountry: 'id',
        cfRay: 'abc-SIN',
      },
      'budi@example.com',
      '0812-3456-7890',
      {
        timezone: 'Asia/Jakarta',
        visitorId: 'v1',
        sessionId: 's1',
        pastedFields: ['message'],
        hadPointerMovement: true,
      },
    );

    expect(details).toMatchObject({
      ipAddress: '203.0.113.7',
      countryCode: 'ID',
      country: 'Indonesia',
      cfRay: 'abc-SIN',
      isp: 'Telkomsel',
      isProxy: false,
      isHosting: false,
      isTor: false,
      userAgent: 'Mozilla/5.0',
      timezone: 'Asia/Jakarta',
      timezoneMismatch: false,
      pastedFields: ['message'],
      hadPointerMovement: true,
      visitorId: 'v1',
      hasTrackedVisit: true,
      emailHasMx: true,
      isDisposableEmail: false,
      phoneCountry: 'ID',
      phoneValid: true,
    });
  });

  it('marks a domain without mail servers and leaves unknowns null', async () => {
    resolveMx.mockRejectedValueOnce(
      Object.assign(new Error('x'), { code: 'ENOTFOUND' }),
    );
    const missing = await service.enrich(
      { ip: null },
      'a@nowhere.invalid',
      '0800',
      {},
    );
    expect(missing.emailHasMx).toBe(false);
    expect(missing.hasTrackedVisit).toBeNull();
    expect(missing.countryCode).toBeNull();

    resolveMx.mockRejectedValueOnce(
      Object.assign(new Error('x'), { code: 'ETIMEOUT' }),
    );
    const unknown = await service.enrich(
      { ip: null },
      'a@example.com',
      '0800',
      {},
    );
    expect(unknown.emailHasMx).toBeNull();
  });

  it('treats Cloudflare T1 as Tor when the exit list is unavailable', async () => {
    tor.isTorExit.mockResolvedValue(null);
    const details = await service.enrich(
      { ip: '198.51.100.1', cfCountry: 'T1' },
      'a@example.com',
      '0800',
      {},
    );
    expect(details.isTor).toBe(true);
    expect(details.countryCode).toBeNull();
  });
});

describe('helpers', () => {
  it('recognises throwaway email domains and their subdomains', () => {
    expect(isDisposableDomain('mailinator.com')).toBe(true);
    expect(isDisposableDomain('x.mailinator.com')).toBe(true);
    expect(isDisposableDomain('gmail.com')).toBe(false);
  });

  it('spots a browser timezone foreign to the IP country', () => {
    expect(timezoneMismatch('Asia/Jakarta', 'ID')).toBe(false);
    expect(timezoneMismatch('America/New_York', 'ID')).toBe(true);
    expect(timezoneMismatch(null, 'ID')).toBeNull();
  });
});
