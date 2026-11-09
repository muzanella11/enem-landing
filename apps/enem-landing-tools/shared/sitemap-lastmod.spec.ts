import { TOOLS_SNAPSHOT } from './tools-registry';
import {
  CONTENT_BASELINE,
  CONTENT_UPDATED,
  contentKeyForPath,
  DAILY_CONTENT_TOOLS,
  lastmodForPath,
  ROUTE_FAMILY_TOOL,
} from './sitemap-lastmod';

const TOOL_SLUGS = new Set(TOOLS_SNAPSHOT.tools.map((tool) => tool.slug));
const PAGE_KEYS = new Set([...TOOL_SLUGS, 'pasang-widget', 'privasi']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TODAY = '2026-12-01';

describe('content date manifest', () => {
  it('only references real tools or pages', () => {
    for (const key of Object.keys(CONTENT_UPDATED)) {
      expect(PAGE_KEYS, `unknown key "${key}"`).toContain(key);
    }
    for (const slug of [
      ...DAILY_CONTENT_TOOLS,
      ...Object.values(ROUTE_FAMILY_TOOL),
    ]) {
      expect(TOOL_SLUGS, `unknown tool "${slug}"`).toContain(slug);
    }
  });

  it('uses valid dates that are not before launch or in the future', () => {
    const now = new Date().toISOString().slice(0, 10);
    for (const [key, date] of Object.entries({
      baseline: CONTENT_BASELINE,
      ...CONTENT_UPDATED,
    })) {
      expect(date, key).toMatch(ISO_DATE);
      expect(Number.isNaN(new Date(date).getTime()), key).toBe(false);
      expect(date >= CONTENT_BASELINE, `${key} before baseline`).toBe(true);
      expect(date <= now, `${key} is in the future`).toBe(true);
    }
  });
});

describe('contentKeyForPath', () => {
  it.each([
    ['/simulasi-kpr', 'simulasi-kpr'],
    ['/upah-minimum/jawa-barat', 'upah-minimum'],
    ['/jadwal-sholat/kota-bandung', 'jadwal-sholat'],
    ['/gaji-bersih/5000000', 'kalkulator-gaji-bersih'],
    ['/thr/5000000', 'kalkulator-thr'],
    ['/token-listrik/100000', 'kalkulator-token-listrik'],
    ['/', ''],
    ['', ''],
  ])('%s -> %s', (path, key) => {
    expect(contentKeyForPath(path)).toBe(key);
  });
});

describe('lastmodForPath', () => {
  it('dates regular pages and their answer pages from the manifest', () => {
    const date = (key: string) => CONTENT_UPDATED[key] ?? CONTENT_BASELINE;

    expect(lastmodForPath('/simulasi-kpr', TODAY)).toBe(date('simulasi-kpr'));
    expect(lastmodForPath('/gaji-bersih/5000000', TODAY)).toBe(
      date('kalkulator-gaji-bersih'),
    );
    expect(lastmodForPath('/privasi', TODAY)).toBe(date('privasi'));
  });

  it('dates daily-content tools and their city pages today', () => {
    expect(lastmodForPath('/jadwal-sholat', TODAY)).toBe(TODAY);
    expect(lastmodForPath('/jadwal-sholat/kota-bandung', TODAY)).toBe(TODAY);
    expect(lastmodForPath('/harga-emas', TODAY)).toBe(TODAY);
  });

  it('does not treat imsakiyah (a fixed Ramadan table) as daily', () => {
    expect(lastmodForPath('/jadwal-imsakiyah/kota-bandung', TODAY)).not.toBe(
      TODAY,
    );
  });

  it('dates the homepage by the newest non-daily listed page', () => {
    const listed = ['/', '/simulasi-kpr', '/jadwal-sholat', '/privasi'];
    const expected = ['simulasi-kpr', 'privasi']
      .map((key) => CONTENT_UPDATED[key] ?? CONTENT_BASELINE)
      .reduce((a, b) => (b > a ? b : a), CONTENT_BASELINE);

    expect(lastmodForPath('/', TODAY, listed)).toBe(expected);
    expect(lastmodForPath('/', TODAY, listed)).not.toBe(TODAY);
  });
});
