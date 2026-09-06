import { BaseEmailTemplate, EmailInfoRow } from './base-email.template.js';

export interface TestEmailPayload {
  host: string;
  port: number;
  secure: boolean;
}

/** Sent from the CMS Settings page's "Send Test Email" button to verify a saved SMTP config actually works. */
export class TestEmailTemplate extends BaseEmailTemplate {
  constructor(private readonly payload: TestEmailPayload) {
    super('Email Percobaan - enem-landing');
  }

  get subject(): string {
    return '[enem-landing] Email Percobaan';
  }

  get preheader(): string {
    return 'Konfigurasi SMTP pada enem-landing berhasil diverifikasi';
  }

  private get connectionRows(): EmailInfoRow[] {
    const { host, port, secure } = this.payload;
    return [
      { label: 'Host', value: `${host}:${port}` },
      { label: 'Enkripsi', value: secure ? 'TLS/SSL aktif' : 'Tanpa enkripsi' },
      {
        label: 'Waktu terkirim',
        value: new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'Asia/Jakarta',
        }).format(new Date()),
      },
    ];
  }

  get body(): string {
    return `
      ${this.renderIconBadge('&#10003;')}
      <p class="email-text-primary" style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;text-align:center;">Konfigurasi SMTP Berhasil</p>
      <p class="email-text-muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;">
        Ini adalah email percobaan untuk memverifikasi konfigurasi SMTP pada <strong class="email-text-primary" style="color:#111827;">enem-landing</strong>. Jika Anda menerima email ini, pengaturan SMTP sudah berfungsi dengan baik dan siap digunakan.
      </p>
      ${this.renderInfoTable(this.connectionRows)}
    `;
  }
}
