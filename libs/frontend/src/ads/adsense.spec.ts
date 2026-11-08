import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAdsenseClientId,
  isAdsenseSlotId,
  loadAdsenseScript,
  pushAdsenseSlot,
} from './adsense.js';

describe('adsense helpers (Story 56)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('validates client and slot ids', () => {
    expect(isAdsenseClientId('ca-pub-8949585919330555')).toBe(true);
    expect(isAdsenseClientId('pub-8949585919330555')).toBe(false);
    expect(isAdsenseClientId(null)).toBe(false);
    expect(isAdsenseSlotId('1234567890')).toBe(true);
    expect(isAdsenseSlotId('12ab')).toBe(false);
    expect(isAdsenseSlotId('')).toBe(false);
  });

  it('does nothing outside the browser', () => {
    expect(() => loadAdsenseScript('ca-pub-8949585919330555')).not.toThrow();
    expect(() => pushAdsenseSlot()).not.toThrow();
  });

  it('appends the script once, only for a valid client id', () => {
    const appended: { src?: string }[] = [];
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {
      querySelector: () => (appended.length ? {} : null),
      createElement: () => ({ dataset: {} }),
      head: { appendChild: (el: { src?: string }) => appended.push(el) },
    });

    loadAdsenseScript('not-an-id');
    expect(appended).toHaveLength(0);
    loadAdsenseScript('ca-pub-8949585919330555');
    loadAdsenseScript('ca-pub-8949585919330555');
    expect(appended).toHaveLength(1);
    expect(appended[0]?.src).toContain('client=ca-pub-8949585919330555');
  });

  it('leaves personalization to the CMP unless told to opt out', () => {
    const fakeWindow: { adsbygoogle?: unknown[] & Record<string, unknown> } =
      {};
    vi.stubGlobal('window', fakeWindow);

    pushAdsenseSlot();
    expect(fakeWindow.adsbygoogle).toHaveLength(1);
    expect(
      fakeWindow.adsbygoogle?.['requestNonPersonalizedAds'],
    ).toBeUndefined();

    pushAdsenseSlot({ nonPersonalized: true });
    expect(fakeWindow.adsbygoogle).toHaveLength(2);
    expect(fakeWindow.adsbygoogle?.['requestNonPersonalizedAds']).toBe(1);
  });
});
