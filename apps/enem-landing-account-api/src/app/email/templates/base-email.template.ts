/**
 * Ported from mau-apps' `libs/backend/email/src/lib/templates/base.template.ts`
 * (branded HTML-table layout + icon badge/info-table/divider helpers,
 * dark-mode aware via `prefers-color-scheme`). Trimmed to a single
 * hardcoded brand/theme rather than mau-apps' per-call `IEmailTheme`
 * override - enem-landing only ever sends as one brand, so a configurable
 * theme would be unused abstraction.
 */
export interface EmailInfoRow {
  label: string;
  value: string;
}

const BRAND = 'Nurfirliana Muzanella';
const ACCENT_START = '#3fcbaf';
const ACCENT_END = '#15967d';
const BORDER_COLOR = '#e5e7eb';
const TEXT_PRIMARY = '#111827';
const TEXT_MUTED = '#6b7280';
const BADGE_BG = '#e6f9f4';
const BADGE_COLOR = '#15967d';

export abstract class BaseEmailTemplate {
  protected constructor(private readonly title: string) {}

  /** Preview text shown next to the subject in most inbox list views. */
  abstract get preheader(): string;

  /** Inner HTML rendered inside the branded card - see `renderIconBadge`/`renderInfoTable` helpers below. */
  abstract get body(): string;

  abstract get subject(): string;

  generateHtml(): string {
    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>${this.title}</title>
        <style>
          @media (prefers-color-scheme: dark) {
            .email-bg { background-color: #18181b !important; }
            .email-card { background-color: #1f2937 !important; border-color: #374151 !important; }
            .email-footer { background-color: #111827 !important; border-color: #374151 !important; }
            .email-text-primary { color: #f3f4f6 !important; }
            .email-text-muted { color: #9ca3af !important; }
            .email-info-table { background-color: #111827 !important; border-color: #374151 !important; }
            .email-info-border { border-color: #374151 !important; }
          }
        </style>
      </head>
      <body class="email-bg" style="margin:0;padding:0;background-color:#f1f0f4;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${this.preheader}${'&zwnj;&nbsp;'.repeat(30)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color:#f1f0f4;">
          <tbody>
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="560" class="email-card" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER_COLOR};">
                  <tbody>
                    <tr>
                      <td style="background:linear-gradient(135deg, ${ACCENT_START}, ${ACCENT_END});background-color:${ACCENT_END};padding:28px 32px;">
                        <span style="display:inline-block;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">${BRAND}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 32px;">
                        ${this.body}
                      </td>
                    </tr>
                    <tr>
                      <td class="email-footer" style="padding:20px 32px;background-color:#fafafa;border-top:1px solid ${BORDER_COLOR};">
                        <p class="email-text-muted" style="margin:0;color:${TEXT_MUTED};font-size:12px;line-height:1.6;">
                          Email ini dikirim otomatis oleh <strong class="email-text-primary" style="color:${TEXT_PRIMARY};">${BRAND}</strong>. Mohon untuk tidak membalas email ini.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">
                  <tbody>
                    <tr>
                      <td align="center" style="padding:20px 16px 0;">
                        <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  protected renderIconBadge(icon: string): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tbody>
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="56">
                <tbody>
                  <tr>
                    <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;border-radius:50%;background-color:${BADGE_BG};font-size:26px;line-height:56px;color:${BADGE_COLOR};">
                      ${icon}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  protected renderInfoTable(rows: EmailInfoRow[]): string {
    const cells = rows
      .map(({ label, value }, index) => {
        const border =
          index === rows.length - 1
            ? ''
            : `border-bottom:1px solid ${BORDER_COLOR};`;
        return `
          <tr>
            <td class="email-text-muted email-info-border" style="padding:12px 16px;color:${TEXT_MUTED};font-size:13px;${border}">${label}</td>
            <td class="email-text-primary email-info-border" style="padding:12px 16px;color:${TEXT_PRIMARY};font-size:13px;font-weight:600;text-align:right;${border}">${value}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="email-info-table" style="background-color:#fafafa;border-radius:12px;overflow:hidden;border:1px solid ${BORDER_COLOR};margin-top:8px;">
        <tbody>
          ${cells}
        </tbody>
      </table>
    `;
  }

  protected renderDivider(): string {
    return `<div class="email-info-border" style="height:1px;background-color:${BORDER_COLOR};margin:24px 0;"></div>`;
  }
}
