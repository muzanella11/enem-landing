import { BaseEmailTemplate } from './base-email.template.js';
import { escapeHtml } from './html-escape.js';

export interface ContactSubmissionConfirmationPayload {
  fullname: string;
  message: string;
}

/** Auto-reply sent back to whoever submitted the contact form, confirming receipt. */
export class ContactSubmissionConfirmationTemplate extends BaseEmailTemplate {
  constructor(private readonly payload: ContactSubmissionConfirmationPayload) {
    super('Pesan Anda Sudah Diterima - enem-landing');
  }

  get subject(): string {
    return '[enem-landing] Pesan Anda sudah kami terima';
  }

  get preheader(): string {
    return 'Terima kasih sudah menghubungi enem-landing - pesan Anda sudah kami terima';
  }

  get body(): string {
    const safeName = escapeHtml(this.payload.fullname);
    const safeMessage = escapeHtml(this.payload.message).replace(
      /\n/g,
      '<br />',
    );
    return `
      ${this.renderIconBadge('&#10003;')}
      <p class="email-text-primary" style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;text-align:center;">Terima kasih, ${safeName}!</p>
      <p class="email-text-muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;">
        Pesan Anda sudah kami terima. Kami akan meninjau dan membalas secepatnya.
      </p>
      ${this.renderDivider()}
      <p class="email-text-muted" style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">Pesan yang Anda kirim:</p>
      <p class="email-text-primary" style="margin:0;color:#111827;font-size:14px;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    `;
  }
}
