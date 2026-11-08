import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_REQUIRED_REGIONS,
  isGaMeasurementId,
  loadGoogleAnalytics,
  setDefaultConsent,
  trackGaEvent,
} from './google-analytics.js';

describe('google analytics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts GA4 measurement ids only', () => {
    expect(isGaMeasurementId('G-ABC123XYZ9')).toBe(true);
    expect(isGaMeasurementId(' G-ABC123XYZ9 ')).toBe(true);
    expect(isGaMeasurementId('UA-83375408-1')).toBe(false);
    expect(isGaMeasurementId('')).toBe(false);
    expect(isGaMeasurementId(null)).toBe(false);
    expect(isGaMeasurementId('G-abc"><script>')).toBe(false);
  });

  it('does nothing outside the browser', () => {
    expect(loadGoogleAnalytics('G-ABC123XYZ9')).toBe(false);
    expect(trackGaEvent('tool_calculate', { tool_id: 'x' })).toBe(false);
  });

  describe('consent defaults (Story 56)', () => {
    it('denies storage only in consent regions, grants it elsewhere', () => {
      const gtag = vi.fn();
      setDefaultConsent(gtag);

      expect(gtag).toHaveBeenCalledTimes(2);
      const [regional, global] = gtag.mock.calls;
      expect(regional?.[0]).toBe('consent');
      expect(regional?.[1]).toBe('default');
      expect(regional?.[2]).toMatchObject({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500,
      });
      expect(regional?.[2].region).toEqual(
        expect.arrayContaining(['DE', 'FR', 'GB', 'CH', 'NO']),
      );
      expect(regional?.[2].region).not.toContain('ID');
      expect(global?.[2]).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    });

    it('covers all 27 EU members plus IS, LI, NO, GB, CH', () => {
      expect(CONSENT_REQUIRED_REGIONS).toHaveLength(32);
      expect(new Set(CONSENT_REQUIRED_REGIONS).size).toBe(32);
    });
  });

  describe('trackGaEvent', () => {
    it('sends the event with undefined params dropped', () => {
      const gtag = vi.fn();
      vi.stubGlobal('window', { gtag });

      expect(
        trackGaEvent('tool_calculate', { tool_id: 'gaji', mode: undefined }),
      ).toBe(true);
      expect(gtag).toHaveBeenCalledWith('event', 'tool_calculate', {
        tool_id: 'gaji',
      });
    });

    it('is a no-op while GA is not set up', () => {
      vi.stubGlobal('window', {});
      expect(trackGaEvent('tool_calculate')).toBe(false);
    });
  });

  describe('loadGoogleAnalytics', () => {
    it('queues consent before config and defers gtag.js until idle', () => {
      const appended: { src?: string }[] = [];
      const idle: (() => void)[] = [];
      const fakeWindow: Record<string, unknown> = {
        requestIdleCallback: (cb: () => void) => idle.push(cb),
      };
      vi.stubGlobal('window', fakeWindow);
      vi.stubGlobal('document', {
        querySelector: () => null,
        createElement: () => ({ dataset: {} }),
        head: { appendChild: (el: { src?: string }) => appended.push(el) },
      });

      expect(loadGoogleAnalytics('G-ABC123XYZ9')).toBe(true);
      const calls = (fakeWindow['dataLayer'] as IArguments[]).map((args) =>
        Array.from(args),
      );
      expect(calls.map((args) => args[0])).toEqual([
        'consent',
        'consent',
        'js',
        'config',
      ]);
      expect(appended).toHaveLength(0);

      idle.forEach((cb) => cb());
      expect(appended).toHaveLength(1);
      expect(appended[0]?.src).toContain('gtag/js?id=G-ABC123XYZ9');

      // Second call is a no-op.
      expect(loadGoogleAnalytics('G-ABC123XYZ9')).toBe(true);
      expect((fakeWindow['dataLayer'] as unknown[]).length).toBe(4);
    });
  });
});
