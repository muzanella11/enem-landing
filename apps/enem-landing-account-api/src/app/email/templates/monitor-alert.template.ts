import { BaseEmailTemplate, EmailInfoRow } from './base-email.template.js';
import { escapeHtml } from './html-escape.js';

export interface MonitorAlertPayload {
  title: string;
  severity: 'critical' | 'warning' | 'info';
  kind: 'firing' | 'resolved';
  environment: string;
  time: string;
  summary: string;
  details: string[];
  url: string;
}

const MAX_DETAIL_LINES = 30;

const SEVERITY_LABEL: Record<MonitorAlertPayload['severity'], string> = {
  critical: 'Kritis',
  warning: 'Peringatan',
  info: 'Info',
};

/**
 * Alert from enem-landing-monitor (crash, OOM, MySQL down, backup failed,
 * ...). Everything in the payload comes from server logs, which can hold
 * attacker-chosen text (usernames in btmp, request paths), so every value
 * is escaped before it lands in the HTML.
 */
export class MonitorAlertTemplate extends BaseEmailTemplate {
  constructor(private readonly payload: MonitorAlertPayload) {
    super('Alert Monitor - Nurfirliana Muzanella');
  }

  private get prefix(): string {
    const env = this.payload.environment.toUpperCase();
    return this.payload.kind === 'resolved'
      ? `[Monitor ${env}] PULIH`
      : `[Monitor ${env}] ${SEVERITY_LABEL[this.payload.severity].toUpperCase()}`;
  }

  get subject(): string {
    // Header injection is not possible through nodemailer, but keep the
    // subject on one line anyway.
    return `${this.prefix}: ${this.payload.title}`.replace(/[\r\n]+/g, ' ');
  }

  get preheader(): string {
    return escapeHtml(this.payload.summary.slice(0, 140));
  }

  private get rows(): EmailInfoRow[] {
    const { severity, kind, environment, time } = this.payload;
    return [
      {
        label: 'Status',
        value: kind === 'resolved' ? 'Sudah pulih' : 'Terjadi',
      },
      { label: 'Severity', value: escapeHtml(SEVERITY_LABEL[severity]) },
      { label: 'Environment', value: escapeHtml(environment) },
      {
        label: 'Waktu',
        value: escapeHtml(
          new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'long',
            timeStyle: 'medium',
            timeZone: 'Asia/Jakarta',
          }).format(new Date(time)) + ' WIB',
        ),
      },
    ];
  }

  get body(): string {
    const { title, summary, details, url, kind } = this.payload;
    const lines = details.slice(0, MAX_DETAIL_LINES).map(escapeHtml).join('\n');
    const accent = kind === 'resolved' ? '#43a047' : '#e53935';
    return `
      ${this.renderIconBadge(kind === 'resolved' ? '&#10003;' : '&#9888;')}
      <p class="email-text-primary" style="margin:0 0 8px;color:${accent};font-size:20px;font-weight:700;text-align:center;">${escapeHtml(title)}</p>
      <p class="email-text-muted" style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;text-align:center;white-space:pre-wrap;">${escapeHtml(summary)}</p>
      ${this.renderInfoTable(this.rows)}
      ${
        lines
          ? `${this.renderDivider()}<p class="email-text-muted" style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">Detail:</p>
      <pre style="margin:0;padding:12px;background:#0f1720;color:#d7dde5;border-radius:8px;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all;">${lines}</pre>`
          : ''
      }
      <p style="margin:24px 0 0;text-align:center;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;border-radius:8px;background-color:#15967d;color:#ffffff;font-weight:600;text-decoration:none;">Buka di Monitor</a>
      </p>
    `;
  }
}
