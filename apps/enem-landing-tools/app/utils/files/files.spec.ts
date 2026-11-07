import { describe, expect, it } from 'vitest';
import {
  centerCrop,
  fitWithin,
  formatBytes,
  isHeic,
  parsePageRanges,
  pasFotoPixels,
  replaceExtension,
  softBatchLimitBytes,
} from './index.js';

describe('parsePageRanges', () => {
  it('parses single pages and ranges', () => {
    expect(parsePageRanges('1-3, 5, 8-9', 10)).toEqual([
      [1, 2, 3],
      [5],
      [8, 9],
    ]);
  });

  it('tolerates spaces and semicolons', () => {
    expect(parsePageRanges(' 2 - 3 ;4', 4)).toEqual([[2, 3], [4]]);
  });

  it.each([
    ['', 'Isi halaman'],
    ['abc', 'bukan format'],
    ['0', 'di luar'],
    ['11', 'di luar'],
    ['5-2', 'terbalik'],
  ])('rejects %j', (input, message) => {
    expect(() => parsePageRanges(input, 10)).toThrow(message);
  });
});

describe('image geometry', () => {
  it('pas foto at 300 dpi', () => {
    expect(pasFotoPixels('3x4')).toEqual({ width: 354, height: 472 });
    expect(pasFotoPixels('2x3')).toEqual({ width: 236, height: 354 });
  });

  it('center crop of a landscape photo to portrait', () => {
    expect(
      centerCrop({ width: 4000, height: 3000 }, { width: 3, height: 4 }),
    ).toEqual({
      x: 875,
      y: 0,
      width: 2250,
      height: 3000,
    });
  });

  it('center crop of a tall photo', () => {
    expect(
      centerCrop({ width: 1000, height: 3000 }, { width: 1, height: 1 }),
    ).toEqual({
      x: 0,
      y: 1000,
      width: 1000,
      height: 1000,
    });
  });

  it('fitWithin never upscales', () => {
    expect(fitWithin({ width: 4000, height: 3000 }, { width: 1600 })).toEqual({
      width: 1600,
      height: 1200,
    });
    expect(fitWithin({ width: 800, height: 600 }, { width: 1600 })).toEqual({
      width: 800,
      height: 600,
    });
  });
});

describe('misc', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(200 * 1024)).toBe('200 KB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5,5 MB');
  });

  it('detects HEIC by type or extension', () => {
    expect(isHeic({ name: 'IMG_0001.HEIC', type: '' })).toBe(true);
    expect(isHeic({ name: 'a.jpg', type: 'image/heif' })).toBe(true);
    expect(isHeic({ name: 'a.jpg', type: 'image/jpeg' })).toBe(false);
  });

  it('replaces extensions', () => {
    expect(replaceExtension('foto.liburan.HEIC', 'jpg')).toBe(
      'foto.liburan.jpg',
    );
  });

  it('soft limit scales with device memory', () => {
    expect(softBatchLimitBytes(4)).toBe(1024 * 1024 * 1024);
    expect(softBatchLimitBytes()).toBe(400 * 1024 * 1024);
  });
});
