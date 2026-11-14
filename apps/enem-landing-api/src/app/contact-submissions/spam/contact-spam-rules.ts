import { findUrls } from '@enem-landing/shared-definitions';

/**
 * Rule-based spam check for contact submissions. Deliberately
 * conservative: a flagged submission is still stored and reviewable in the
 * CMS (only its emails are skipped), so a missed spam costs less than a
 * lost real message.
 */

/**
 * Phrases typical of mass "contact form marketing" (SEO, traffic, leads).
 * One phrase alone is not enough: a real client may well write about SEO.
 */
export const SOLICITATION_PHRASES = [
  'targeted traffic',
  'drive traffic',
  'more traffic',
  'within 24 hours',
  'pick the keywords',
  'first page of google',
  'page 1 of google',
  'backlinks',
  'guest post',
  'link building',
  'domain authority',
  'lead generation',
  "something you'd like to explore",
  'something you would like to explore',
  'are you interested',
  'would you be interested',
  'unsubscribe',
  'opt out',
  'reply stop',
  'boost your ranking',
  'tingkatkan traffic',
  'halaman pertama google',
  'jasa backlink',
] as const;

/** Phrase hits at or above this mark a submission as spam. */
export const SOLICITATION_THRESHOLD = 2;

/** Any one of these is enough. */
export const BLOCKED_KEYWORDS = [
  'casino',
  'viagra',
  'cialis',
  'porn',
  'escort',
  'forex signal',
  'crypto investment',
  'bitcoin investment',
  'slot gacor',
  'judi online',
  'togel',
  'pinjol',
] as const;

/** Top-level domains rarely used by legitimate senders here. */
export const SPAM_TLDS = [
  'ru',
  'cn',
  'xyz',
  'top',
  'click',
  'loan',
  'work',
  'buzz',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
] as const;

/** Share of letters outside the Latin script that counts as foreign. */
const NON_LATIN_RATIO = 0.5;

export interface SpamContent {
  fullname: string;
  message: string;
}

export interface SpamSenderSignals {
  isTor?: boolean | null;
  isHosting?: boolean | null;
  visitorId?: string | null;
  hasTrackedVisit?: boolean | null;
  hadPointerMovement?: boolean | null;
  isDisposableEmail?: boolean | null;
  emailHasMx?: boolean | null;
}

export interface SpamVerdict {
  isSpam: boolean;
  reasons: string[];
}

const includesPhrase = (text: string, phrase: string) => text.includes(phrase);

export const solicitationHits = (message: string): string[] => {
  const text = message.toLowerCase().replace(/[’`]/g, "'");
  return SOLICITATION_PHRASES.filter((phrase) => includesPhrase(text, phrase));
};

const nonLatinShare = (text: string): number => {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 0;
  const latin = letters.filter((letter) => /\p{Script=Latin}/u.test(letter));
  return 1 - latin.length / letters.length;
};

const spamTldUrls = (message: string): string[] =>
  findUrls(message).filter((url) => {
    const host = url
      .replace(/^https?:\/\//i, '')
      .split(/[/?#]/)[0]
      .toLowerCase();
    const tld = host.split('.').pop() ?? '';
    return (SPAM_TLDS as readonly string[]).includes(tld);
  });

/** Six or more consonants in a row: keyboard mash, not a name. */
const looksRandom = (name: string) => /[bcdfghjklmnpqrstvwxz]{6,}/i.test(name);

export const evaluateSpam = (
  content: SpamContent,
  sender: SpamSenderSignals = {},
): SpamVerdict => {
  const reasons: string[] = [];
  const message = content.message.toLowerCase();
  const name = content.fullname.trim();

  const keywords = BLOCKED_KEYWORDS.filter((keyword) =>
    includesPhrase(message, keyword),
  );
  if (keywords.length > 0) reasons.push(`keywords:${keywords.join(',')}`);

  if (spamTldUrls(content.message).length > 0) reasons.push('url:spam-tld');

  if (
    nonLatinShare(`${content.fullname} ${content.message}`) > NON_LATIN_RATIO
  ) {
    reasons.push('script:non-latin');
  }

  if (name.toLowerCase() === content.message.trim().toLowerCase()) {
    reasons.push('name:equals-message');
  } else if (looksRandom(name)) {
    reasons.push('name:random');
  }

  const phrases = solicitationHits(content.message);
  if (phrases.length >= SOLICITATION_THRESHOLD) {
    reasons.push(`phrases:${phrases.join(',')}`);
  }

  const riskyNetwork = sender.isTor
    ? 'tor'
    : sender.isHosting
      ? 'hosting'
      : null;
  if (riskyNetwork) {
    const noVisit = !sender.visitorId || sender.hasTrackedVisit === false;
    const noPointer = sender.hadPointerMovement === false;
    if (noVisit || noPointer) {
      reasons.push(
        `sender:${riskyNetwork}+${noVisit ? 'no-visitor' : 'no-pointer'}`,
      );
    }
  }

  if (sender.isDisposableEmail) reasons.push('email:disposable');
  if (sender.emailHasMx === false) reasons.push('email:no-mx');

  return { isSpam: reasons.length > 0, reasons };
};

/** `spamReason` column value, capped at its 255-character width. */
export const formatSpamReason = (reasons: string[]): string | null =>
  reasons.length > 0 ? reasons.join('; ').slice(0, 255) : null;
