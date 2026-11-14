import { describe, expect, it } from 'vitest';
import { verifyDrag } from './captcha-verification.js';

const humanTrail: [number, number, number][] = [
  [0, 0, 0],
  [6, 1, 40],
  [21, 1, 95],
  [48, 2, 160],
  [83, 1, 260],
  [110, 0, 380],
  [121, 1, 470],
  [124, 1, 560],
];

describe('verifyDrag', () => {
  it('accepts a human-looking drag onto the hole', () => {
    expect(
      verifyDrag({
        expectedX: 122,
        x: 124,
        durationMs: 560,
        trail: humanTrail,
      }),
    ).toEqual({
      ok: true,
    });
  });

  it('rejects a drop away from the hole', () => {
    expect(
      verifyDrag({
        expectedX: 150,
        x: 124,
        durationMs: 560,
        trail: humanTrail,
      }),
    ).toEqual({
      ok: false,
      reason: 'position',
    });
  });

  it('rejects an instant drop', () => {
    expect(
      verifyDrag({ expectedX: 124, x: 124, durationMs: 50, trail: humanTrail })
        .ok,
    ).toBe(false);
  });

  it('rejects a jump with too few samples', () => {
    expect(
      verifyDrag({
        expectedX: 124,
        x: 124,
        durationMs: 600,
        trail: [
          [0, 0, 0],
          [124, 0, 600],
        ],
      }),
    ).toEqual({ ok: false, reason: 'trail' });
  });

  it('rejects a perfectly even scripted sweep', () => {
    const trail = Array.from({ length: 11 }, (_, index) => [
      index * 12,
      0,
      index * 50,
    ]) as [number, number, number][];
    expect(
      verifyDrag({ expectedX: 120, x: 120, durationMs: 500, trail }),
    ).toEqual({
      ok: false,
      reason: 'robotic',
    });
  });

  it('accepts keyboard nudges with uneven timing', () => {
    const times = [0, 130, 210, 390, 470, 600, 720];
    const trail = times.map((t, index) => [index * 10, 0, t]) as [
      number,
      number,
      number,
    ][];
    expect(
      verifyDrag({ expectedX: 60, x: 60, durationMs: 720, trail }).ok,
    ).toBe(true);
  });
});
