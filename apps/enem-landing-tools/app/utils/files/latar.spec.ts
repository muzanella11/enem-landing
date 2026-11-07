import { describe, expect, it } from 'vitest';
import {
  alphaDariMask,
  cropPasFoto,
  hexKeRgb,
  komposit,
  kotakOrang,
  tataLembar,
} from './latar.js';

describe('latar', () => {
  it('hex colours', () => {
    expect(hexKeRgb('#DB1514')).toEqual([219, 21, 20]);
    expect(hexKeRgb('nope')).toEqual([255, 255, 255]);
  });

  it('soft mask edge', () => {
    expect(alphaDariMask(0)).toBe(0);
    expect(alphaDariMask(1)).toBe(1);
    expect(alphaDariMask(0.5)).toBeCloseTo(0.5);
  });

  it('composite over colour and to transparency', () => {
    const foto = new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 255]);
    const mask = new Uint8ClampedArray([255, 0]);
    expect([...komposit(foto, mask, [200, 0, 0])]).toEqual([
      10, 20, 30, 255, 200, 0, 0, 255,
    ]);
    expect([...komposit(foto, mask, null)]).toEqual([
      10, 20, 30, 255, 10, 20, 30, 0,
    ]);
  });

  it('person box and head centre', () => {
    // 4x4: head at x=1..2 rows 0..1, shoulders x=0..3 rows 2..3
    const mask = new Uint8ClampedArray([
      0, 255, 255, 0, 0, 255, 255, 0, 255, 255, 255, 255, 255, 255, 255, 255,
    ]);
    expect(kotakOrang(mask, 4, 4)).toMatchObject({
      minX: 0,
      minY: 0,
      maxX: 3,
      maxY: 3,
      tengahKepalaX: 1.5,
    });
    expect(kotakOrang(new Uint8ClampedArray(4), 2, 2)).toBeNull();
  });

  it('passport crop keeps the ratio inside the image', () => {
    const crop = cropPasFoto(
      { minY: 100, tengahKepalaX: 500 },
      1000,
      1500,
      3 / 4,
    );
    expect(crop.lebar / crop.tinggi).toBeCloseTo(0.75, 2);
    expect(crop.x).toBeGreaterThanOrEqual(0);
    expect(crop.x + crop.lebar).toBeLessThanOrEqual(1000);
    expect(crop.y + crop.tinggi).toBeLessThanOrEqual(1500);
    expect(crop.y).toBeLessThan(100);
  });

  it('print sheet layout', () => {
    // 3x4 cm on 4R: (10.2-0.3)/3.3 = 3 columns, (15.2-0.3)/4.3 = 3 rows
    expect(tataLembar('4R', { lebar: 3, tinggi: 4 })).toMatchObject({
      kolom: 3,
      baris: 3,
    });
    expect(tataLembar('4R', { lebar: 2, tinggi: 3 }).posisi).toHaveLength(
      4 * 4,
    );
  });
});
