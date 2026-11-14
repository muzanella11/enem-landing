import { describe, expect, it } from 'vitest';
import { evaluateSpam, formatSpamReason } from './contact-spam-rules.js';

const legit = {
  fullname: 'Budi Santoso',
  message: 'Halo, saya ingin diskusi soal pembuatan website untuk toko saya.',
};

describe('evaluateSpam', () => {
  it('lets a normal message through', () => {
    expect(evaluateSpam(legit)).toEqual({ isSpam: false, reasons: [] });
  });

  it('flags the traffic-offer spam through its phrases', () => {
    const verdict = evaluateSpam({
      fullname: 'Patrick Donovan',
      message:
        "Our system drives targeted traffic to your website within 24 hours of setup. You pick the keywords, we do the rest.\nIs this something you'd like to explore?",
    });
    expect(verdict.isSpam).toBe(true);
    expect(verdict.reasons[0]).toBe(
      "phrases:targeted traffic,within 24 hours,pick the keywords,something you'd like to explore",
    );
  });

  it('does not flag a single SEO mention from a real client', () => {
    expect(
      evaluateSpam({
        fullname: 'Sari',
        message: 'Saya butuh bantuan SEO untuk website toko saya',
      }).isSpam,
    ).toBe(false);
  });

  it('flags blocked keywords and spammy TLDs', () => {
    expect(
      evaluateSpam({ fullname: 'Joe', message: 'Best casino bonus here' })
        .reasons,
    ).toContain('keywords:casino');
    expect(
      evaluateSpam({
        fullname: 'Joe',
        message: 'Visit https://cheap-deals.xyz now',
      }).reasons,
    ).toContain('url:spam-tld');
  });

  it('flags mostly non-Latin text', () => {
    expect(
      evaluateSpam({
        fullname: 'Иван',
        message: 'Здравствуйте, предлагаем услуги',
      }).reasons,
    ).toContain('script:non-latin');
  });

  it('flags a name that repeats the message or looks random', () => {
    expect(
      evaluateSpam({ fullname: 'hello there', message: 'Hello there' }).reasons,
    ).toContain('name:equals-message');
    expect(evaluateSpam({ ...legit, fullname: 'xkcdqwrtz' }).reasons).toContain(
      'name:random',
    );
  });

  it('flags a data-center sender with no tracker visit', () => {
    expect(
      evaluateSpam(legit, { isHosting: true, visitorId: null }).reasons,
    ).toContain('sender:hosting+no-visitor');
    expect(
      evaluateSpam(legit, {
        isTor: true,
        visitorId: 'v1',
        hasTrackedVisit: true,
        hadPointerMovement: false,
      }).reasons,
    ).toContain('sender:tor+no-pointer');
  });

  it('does not flag a data-center sender that behaves like a visitor', () => {
    expect(
      evaluateSpam(legit, {
        isHosting: true,
        visitorId: 'v1',
        hasTrackedVisit: true,
        hadPointerMovement: true,
      }).isSpam,
    ).toBe(false);
  });

  it('flags disposable or undeliverable email domains', () => {
    expect(evaluateSpam(legit, { isDisposableEmail: true }).reasons).toContain(
      'email:disposable',
    );
    expect(evaluateSpam(legit, { emailHasMx: false }).reasons).toContain(
      'email:no-mx',
    );
    expect(evaluateSpam(legit, { emailHasMx: null }).isSpam).toBe(false);
  });
});

describe('formatSpamReason', () => {
  it('joins reasons and caps the length', () => {
    expect(formatSpamReason([])).toBeNull();
    expect(formatSpamReason(['a', 'b'])).toBe('a; b');
    expect(formatSpamReason(['x'.repeat(300)])).toHaveLength(255);
  });
});
