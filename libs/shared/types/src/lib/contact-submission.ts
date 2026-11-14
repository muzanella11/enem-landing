import type { ContactClientSignals } from '@enem-landing/shared-definitions';

export interface ContactSubmission {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  message: string;
  readAt: string | null;
  /** Flagged by the spam rules (or by an admin); never triggers emails. */
  isSpam: boolean;
  /** Which rules flagged it, e.g. `phrases:targeted traffic,within 24 hours`. */
  spamReason: string | null;
  createdAt: string;
}

/** What the browser sends to the web BFF. */
export interface CreateContactSubmissionInput {
  fullname: string;
  email: string;
  phoneNumber: string;
  message: string;
  /** Single-use token from a solved slider captcha. */
  captchaToken?: string;
  client?: ContactClientSignals;
}

/**
 * Sender details recorded with a submission for spam review. Admin-only,
 * deleted after the retention window.
 */
export interface ContactSubmissionSender {
  ipAddress: string | null;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  cfRay: string | null;
  asn: string | null;
  isp: string | null;
  org: string | null;
  isProxy: boolean | null;
  isHosting: boolean | null;
  isTor: boolean | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  referer: string | null;
  timezone: string | null;
  timezoneMismatch: boolean | null;
  language: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  fillDurationMs: number | null;
  keystrokeCount: number | null;
  pastedFields: string[] | null;
  hadPointerMovement: boolean | null;
  visitorId: string | null;
  sessionId: string | null;
  hasTrackedVisit: boolean | null;
  emailHasMx: boolean | null;
  isDisposableEmail: boolean | null;
  phoneCountry: string | null;
  phoneValid: boolean | null;
  createdAt: string;
}

export interface ContactSubmissionDetail extends ContactSubmission {
  sender: ContactSubmissionSender | null;
  /** Other submissions from the same IP (sender data still retained). */
  sameIpCount: number;
  /** Other submissions from the same tracker visitor. */
  sameVisitorCount: number;
}

export type ContactSubmissionStatusFilter = 'inbox' | 'spam' | 'all';

/** Slider captcha challenge served to the contact form. */
export type CaptchaChallenge =
  | { enabled: false }
  | {
      enabled: true;
      id: string;
      width: number;
      height: number;
      /** Side length of the square piece image. */
      pieceSize: number;
      /** Vertical offset of the piece, in px from the top. */
      pieceY: number;
      /** Background with the cut-out, as a PNG data URL. */
      background: string;
      /** The puzzle piece, as a PNG data URL. */
      piece: string;
      expiresInSeconds: number;
    };

export interface CaptchaVerifyInput {
  id: string;
  /** Final left offset of the piece, in px. */
  x: number;
  /** Drag duration in ms. */
  durationMs: number;
  /** Sampled `[x, y, t]` points of the drag, t in ms since drag start. */
  trail: [number, number, number][];
}
