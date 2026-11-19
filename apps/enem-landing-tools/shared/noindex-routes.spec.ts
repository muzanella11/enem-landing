import { describe, expect, it } from 'vitest';
import { isNoindexPath } from './noindex-routes';

describe('isNoindexPath', () => {
  it('flags programmatic answer pages of noindex families', () => {
    expect(isNoindexPath('/thr/10000000')).toBe(true);
    expect(isNoindexPath('/gaji-bersih/5000000')).toBe(true);
    expect(isNoindexPath('/token-listrik/100000')).toBe(true);
    expect(isNoindexPath('/jadwal-imsakiyah/kota-bandung')).toBe(true);
  });

  it('keeps family index pages and other tools indexable', () => {
    expect(isNoindexPath('/jadwal-imsakiyah')).toBe(false);
    expect(isNoindexPath('/jadwal-sholat/kota-bandung')).toBe(false);
    expect(isNoindexPath('/upah-minimum/dki-jakarta')).toBe(false);
    expect(isNoindexPath('/kalkulator-thr')).toBe(false);
    expect(isNoindexPath('/')).toBe(false);
  });
});
