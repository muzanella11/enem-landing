import { describe, expect, it } from 'vitest';
import {
  CONTACT_PHONE_PATTERN,
  countUrls,
  hasLinkMarkup,
  sanitizeClientSignals,
} from './contact.js';

describe('contact rules', () => {
  it.each(['081234567890', '+62 812-3456-7890', '8054002077'])(
    'accepts phone %s',
    (phone) => expect(CONTACT_PHONE_PATTERN.test(phone)).toBe(true),
  );

  it.each(['credo', '0800', '+62 abc 123', '1'.repeat(25)])(
    'rejects phone %s',
    (phone) => expect(CONTACT_PHONE_PATTERN.test(phone)).toBe(false),
  );

  it('counts links in their usual spellings', () => {
    expect(
      countUrls('see https://a.example/x, www.spam.biz and cheap-seo.xyz now'),
    ).toBe(3);
    expect(countUrls('Saya butuh bantuan SEO untuk website toko saya')).toBe(0);
  });

  it('detects link markup', () => {
    expect(hasLinkMarkup('<a href="x">hi</a>')).toBe(true);
    expect(hasLinkMarkup('[url=http://x]hi[/url]')).toBe(true);
    expect(hasLinkMarkup('plain text')).toBe(false);
  });
});

describe('sanitizeClientSignals', () => {
  it('keeps valid signals', () => {
    expect(
      sanitizeClientSignals({
        timezone: 'Asia/Jakarta',
        language: 'id-ID',
        screenWidth: 1440,
        screenHeight: 900,
        fillDurationMs: 42_000,
        keystrokeCount: 120,
        pastedFields: ['message', 'message', 'bogus'],
        hadPointerMovement: true,
        visitorId: 'v_1',
        sessionId: 's_1',
      }),
    ).toEqual({
      timezone: 'Asia/Jakarta',
      language: 'id-ID',
      screenWidth: 1440,
      screenHeight: 900,
      fillDurationMs: 42_000,
      keystrokeCount: 120,
      pastedFields: ['message'],
      hadPointerMovement: true,
      visitorId: 'v_1',
      sessionId: 's_1',
    });
  });

  it('drops malformed values instead of failing', () => {
    expect(
      sanitizeClientSignals({
        timezone: 'x'.repeat(100),
        screenWidth: -1,
        fillDurationMs: 1.5,
        hadPointerMovement: 'yes',
        extra: 'ignored',
      }),
    ).toEqual({});
  });

  it('handles non-object input', () => {
    expect(sanitizeClientSignals(null)).toEqual({});
    expect(sanitizeClientSignals('x')).toEqual({});
  });
});
