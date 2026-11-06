import { describe, expect, it } from 'vitest';
import { findProvinsi, kenaikanUmp, UMP_PROVINSI } from './index.js';

describe('UMP data', () => {
  it('lists all 38 provinces with unique slugs', () => {
    expect(UMP_PROVINSI).toHaveLength(38);
    expect(new Set(UMP_PROVINSI.map((provinsi) => provinsi.slug)).size).toBe(
      38,
    );
  });

  it('never estimates 2027 before it is announced', () => {
    expect(UMP_PROVINSI.every((provinsi) => provinsi.ump2027 === null)).toBe(
      true,
    );
  });

  it('keeps the published 2026 increase for Jakarta', () => {
    const jakarta = findProvinsi('dki-jakarta')!;
    expect(kenaikanUmp(jakarta.ump2025, jakarta.ump2026)?.persen).toBeCloseTo(
      6.17,
      2,
    );
  });

  it('returns null change when a year is missing', () => {
    expect(kenaikanUmp(null, 3_000_000)).toBeNull();
    expect(findProvinsi('aceh')?.ump2026).toBeNull();
  });
});
