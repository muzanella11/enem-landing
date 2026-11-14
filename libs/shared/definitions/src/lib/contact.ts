/**
 * Contact form rules shared by the web form (VeeValidate + Zod) and
 * enem-landing-api's DTO (class-validator), so both sides always agree.
 */
export const CONTACT_FULLNAME_MIN = 2;
export const CONTACT_FULLNAME_MAX = 100;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_MESSAGE_MIN = 10;
export const CONTACT_MESSAGE_MAX = 2000;
/** Most links a message may contain. */
export const CONTACT_MESSAGE_MAX_URLS = 2;
/** Digits with an optional leading `+`, spaces and dashes allowed. */
export const CONTACT_PHONE_PATTERN = /^\+?[0-9\s-]{8,20}$/;
/** A submission faster than this after the form appeared is a bot. */
export const CONTACT_MIN_FILL_MS = 3000;
/** Name of the hidden honeypot field humans never fill in. */
export const CONTACT_HONEYPOT_FIELD = 'website';

export const CONTACT_FIELDS = [
  'fullname',
  'email',
  'phoneNumber',
  'message',
] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s<>"]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|info|biz|io|co|me|xyz|top|site|online|shop|store|link|click|ru|cn|tk|ml|ga|cf|gq|buzz|loan|work|id)\b(?:\/[^\s<>"]*)?/gi;
const LINK_MARKUP_PATTERN = /<a\s+href|\[url=/i;

/** Every link-looking substring (`https://..`, `www...`, `example.com`). */
export const findUrls = (text: string): string[] =>
  text.match(URL_PATTERN) ?? [];

export const countUrls = (text: string): number => findUrls(text).length;

/** HTML anchors or BBCode links, the usual markup of forum/form spam. */
export const hasLinkMarkup = (text: string): boolean =>
  LINK_MARKUP_PATTERN.test(text);

/** Browser-side signals the form sends along with a submission. */
export interface ContactClientSignals {
  timezone?: string;
  language?: string;
  screenWidth?: number;
  screenHeight?: number;
  /** Time from the form appearing to submit, in ms. */
  fillDurationMs?: number;
  keystrokeCount?: number;
  /** Fields whose content arrived through a paste. */
  pastedFields?: ContactField[];
  /** Whether any mouse/touch/pen movement happened over the form. */
  hadPointerMovement?: boolean;
  visitorId?: string;
  sessionId?: string;
}

const MAX_INT_SIGNAL = 86_400_000;

const cleanString = (value: unknown, maxLength: number): string | undefined =>
  typeof value === 'string' && value.trim() && value.length <= maxLength
    ? value.trim()
    : undefined;

const cleanInt = (value: unknown, max: number): number | undefined =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max
    ? value
    : undefined;

/**
 * Keeps only well-formed signals and drops the rest. Signals come from the
 * browser, so they are hints, never proof: a malformed one is ignored
 * instead of failing the visitor's submission.
 */
export const sanitizeClientSignals = (input: unknown): ContactClientSignals => {
  if (!input || typeof input !== 'object') return {};
  const raw = input as Record<string, unknown>;
  const pastedFields = Array.isArray(raw['pastedFields'])
    ? [
        ...new Set(
          raw['pastedFields'].filter((field): field is ContactField =>
            (CONTACT_FIELDS as readonly unknown[]).includes(field),
          ),
        ),
      ]
    : undefined;

  const signals: ContactClientSignals = {
    timezone: cleanString(raw['timezone'], 64),
    language: cleanString(raw['language'], 35),
    screenWidth: cleanInt(raw['screenWidth'], 10_000),
    screenHeight: cleanInt(raw['screenHeight'], 10_000),
    fillDurationMs: cleanInt(raw['fillDurationMs'], MAX_INT_SIGNAL),
    keystrokeCount: cleanInt(raw['keystrokeCount'], 100_000),
    pastedFields,
    hadPointerMovement:
      typeof raw['hadPointerMovement'] === 'boolean'
        ? raw['hadPointerMovement']
        : undefined,
    visitorId: cleanString(raw['visitorId'], 64),
    sessionId: cleanString(raw['sessionId'], 64),
  };

  return Object.fromEntries(
    Object.entries(signals).filter(([, value]) => value !== undefined),
  ) as ContactClientSignals;
};
