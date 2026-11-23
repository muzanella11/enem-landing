import { describe, expect, it } from 'vitest';
import { MonitorAlertTemplate } from './monitor-alert.template.js';

const payload = {
  title: 'Container crash: enem-landing-api',
  severity: 'critical' as const,
  kind: 'firing' as const,
  environment: 'prod',
  time: '2026-11-23T10:00:00.000Z',
  summary: 'exit 137 (OOMKilled)',
  details: ['line 1'],
  url: 'https://monitor.muzanella.com/apps',
};

describe('MonitorAlertTemplate', () => {
  it('escapes every value that comes from logs', () => {
    const html = new MonitorAlertTemplate({
      ...payload,
      title: '<script>alert(1)</script>',
      summary: 'user <img src=x onerror=1>',
      details: ['Failed password for <b>root</b>'],
    }).generateHtml();
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>root</b>');
    expect(html).toContain('&lt;b&gt;root&lt;/b&gt;');
  });

  it('keeps at most 30 detail lines', () => {
    const html = new MonitorAlertTemplate({
      ...payload,
      details: Array.from({ length: 40 }, (_, index) => `detail-${index}-end`),
    }).generateHtml();
    expect(html).toContain('detail-29-end');
    expect(html).not.toContain('detail-30-end');
  });

  it('marks resolved alerts in the subject', () => {
    expect(new MonitorAlertTemplate(payload).subject).toBe(
      '[Monitor PROD] KRITIS: Container crash: enem-landing-api',
    );
    expect(
      new MonitorAlertTemplate({ ...payload, kind: 'resolved' }).subject,
    ).toBe('[Monitor PROD] PULIH: Container crash: enem-landing-api');
  });

  it('links to the monitor page', () => {
    expect(new MonitorAlertTemplate(payload).generateHtml()).toContain(
      'href="https://monitor.muzanella.com/apps"',
    );
  });
});
