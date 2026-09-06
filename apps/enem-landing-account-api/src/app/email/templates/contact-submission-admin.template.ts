import { BaseEmailTemplate, EmailInfoRow } from './base-email.template.js';
import { escapeHtml } from './html-escape.js';

export interface ContactSubmissionPayload {
  fullname: string;
  email: string;
  phoneNumber: string;
  message: string;
}

/** Notifies the site admin of a new contact-form submission. */
export class ContactSubmissionAdminTemplate extends BaseEmailTemplate {
  constructor(private readonly payload: ContactSubmissionPayload) {
    super('Pesan Baru dari Contact Form - enem-landing');
  }

  get subject(): string {
    return `[enem-landing] Pesan baru dari ${this.payload.fullname}`;
  }

  get preheader(): string {
    return `Pesan baru dari ${this.payload.fullname} lewat contact form enem-landing`;
  }

  private get detailRows(): EmailInfoRow[] {
    const { fullname, email, phoneNumber } = this.payload;
    return [
      { label: 'Nama', value: escapeHtml(fullname) },
      { label: 'Email', value: escapeHtml(email) },
      { label: 'No. HP', value: escapeHtml(phoneNumber) },
    ];
  }

  get body(): string {
    const safeMessage = escapeHtml(this.payload.message).replace(
      /\n/g,
      '<br />',
    );
    return `
      ${this.renderIconBadge('&#9993;')}
      <p class="email-text-primary" style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;text-align:center;">Pesan Baru Masuk</p>
      <p class="email-text-muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;">
        Ada pengunjung baru saja mengirim pesan lewat contact form <strong class="email-text-primary" style="color:#111827;">enem-landing</strong>.
      </p>
      ${this.renderInfoTable(this.detailRows)}
      ${this.renderDivider()}
      <p class="email-text-muted" style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">Pesan:</p>
      <p class="email-text-primary" style="margin:0;color:#111827;font-size:14px;line-height:1.7;white-space:pre-wrap;">${safeMessage}</p>
    `;
  }
}
