import { describe, expect, it } from 'vitest';
import { inkBounds, transparentize } from './signature.js';

const pixels = (...values: number[][]) =>
  new Uint8ClampedArray(values.flatMap((rgb) => [...rgb, 255]));

describe('transparentize', () => {
  it('white paper becomes transparent, dark ink stays opaque', () => {
    const out = transparentize(pixels([255, 255, 255], [10, 10, 40]));
    expect(out[3]).toBe(0);
    expect(out[7]).toBe(255);
  });

  it('gray edge pixels are partly transparent', () => {
    const alpha = transparentize(pixels([170, 170, 170]))[3]!;
    expect(alpha).toBeGreaterThan(0);
    expect(alpha).toBeLessThan(255);
  });
});

describe('inkBounds', () => {
  it('finds the ink in a 4x3 image', () => {
    const rgba = new Uint8ClampedArray(4 * 3 * 4);
    rgba[(1 * 4 + 2) * 4 + 3] = 255; // x 2, y 1
    expect(inkBounds(rgba, 4, 3, 0)).toEqual({
      x: 2,
      y: 1,
      width: 1,
      height: 1,
    });
    expect(inkBounds(rgba, 4, 3, 1)).toEqual({
      x: 1,
      y: 0,
      width: 3,
      height: 3,
    });
  });

  it('empty image is null', () => {
    expect(inkBounds(new Uint8ClampedArray(16), 2, 2)).toBeNull();
  });
});
