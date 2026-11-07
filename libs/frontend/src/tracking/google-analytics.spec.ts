import { describe, expect, it } from 'vitest';
import { isGaMeasurementId, loadGoogleAnalytics } from './google-analytics.js';

describe('google analytics', () => {
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
  });
});
