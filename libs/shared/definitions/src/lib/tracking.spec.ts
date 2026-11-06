import { describe, expect, it } from 'vitest';
import {
  isRecordingAllowedForSite,
  sanitizeToolsEventPayload,
} from './tracking.js';

describe('sanitizeToolsEventPayload', () => {
  it('keeps whitelisted string keys', () => {
    expect(
      sanitizeToolsEventPayload({
        toolId: 'kalkulator-gaji-bersih',
        mode: 'tahunan',
      }),
    ).toEqual({ toolId: 'kalkulator-gaji-bersih', mode: 'tahunan' });
  });

  it('drops keys outside the whitelist', () => {
    expect(
      sanitizeToolsEventPayload({ toolId: 'zakat', gaji: 'rahasia' }),
    ).toEqual({ toolId: 'zakat' });
  });

  it('drops numeric values and numeric-looking strings', () => {
    expect(
      sanitizeToolsEventPayload({
        toolId: 'kpr',
        step: 15000000,
        mode: '12.500.000',
      }),
    ).toEqual({ toolId: 'kpr' });
  });

  it('truncates long strings', () => {
    const result = sanitizeToolsEventPayload({ action: 'a'.repeat(200) });
    expect(result?.['action']).toHaveLength(64);
  });

  it('returns null when nothing survives or the input is not an object', () => {
    expect(sanitizeToolsEventPayload({ salary: 'x' })).toBeNull();
    expect(sanitizeToolsEventPayload('toolId')).toBeNull();
    expect(sanitizeToolsEventPayload(['toolId'])).toBeNull();
    expect(sanitizeToolsEventPayload(null)).toBeNull();
  });
});

describe('isRecordingAllowedForSite', () => {
  it('blocks recording for tools only', () => {
    expect(isRecordingAllowedForSite('landing')).toBe(true);
    expect(isRecordingAllowedForSite('tools')).toBe(false);
  });
});
