import { BaseEmailTemplate } from './base-email.template.js';
import { escapeHtml } from './html-escape.js';

export interface ContactSubmissionConfirmationPayload {
  fullname: string;
}

/** Longest name the auto-reply greets with. */
export const CONFIRMATION_NAME_MAX_LENGTH = 50;

/**
 * Auto-reply sent back to whoever submitted the contact form, confirming
 * receipt. It never echoes the visitor's message: the address it goes to is
 * whatever was typed into the form, so echoing the message let spammers use
 * this form to deliver their text to third parties through our SMTP. The
 * greeting name is also capped so it can't carry a sales pitch.
 */
export class ContactSubmissionConfirmationTemplate extends BaseEmailTemplate {
  constructor(private readonly payload: ContactSubmissionConfirmationPayload) {
    super('Pesan Anda Sudah Diterima - Nurfirliana Muzanella');
  }

  get subject(): string {
    return '[Nurfirliana Muzanella] Pesan Anda sudah kami terima';
  }

  get preheader(): string {
    return 'Terima kasih sudah menghubungi Nurfirliana Muzanella - pesan Anda sudah kami terima';
  }

  get body(): string {
    const name = this.payload.fullname.trim();
    const shortName =
      name.length > CONFIRMATION_NAME_MAX_LENGTH
        ? `${name.slice(0, CONFIRMATION_NAME_MAX_LENGTH).trimEnd()}...`
        : name;
    const safeName = escapeHtml(shortName);
    return `
      ${this.renderIconBadge('&#10003;')}
      <p class="email-text-primary" style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;text-align:center;">Terima kasih, ${safeName}!</p>
      <p class="email-text-muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;">
        Pesan Anda sudah kami terima. Kami akan meninjau dan membalas secepatnya.
      </p>
    `;
  }
}
