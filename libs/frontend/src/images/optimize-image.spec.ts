import { describe, expect, it } from 'vitest';
import {
  fitWithin,
  optimizeImageForUpload,
  toWebpName,
} from './optimize-image.js';

describe('optimize-image', () => {
  it('scales down to the max width, keeping the aspect ratio', () => {
    expect(fitWithin(3200, 1800, 1600)).toEqual({ width: 1600, height: 900 });
    expect(fitWithin(1352, 682, 1600)).toEqual({ width: 1352, height: 682 });
    expect(fitWithin(5000, 1, 1600)).toEqual({ width: 1600, height: 1 });
  });

  it('renames to .webp', () => {
    expect(toWebpName('Screen Shot.PNG')).toBe('Screen Shot.webp');
    expect(toWebpName('a.b.jpeg')).toBe('a.b.webp');
    expect(toWebpName('noext')).toBe('noext.webp');
  });

  it('returns GIFs and anything outside a browser untouched', async () => {
    const gif = new File(['x'], 'a.gif', { type: 'image/gif' });
    expect(await optimizeImageForUpload(gif)).toBe(gif);
    const png = new File(['x'], 'a.png', { type: 'image/png' });
    expect(await optimizeImageForUpload(png)).toBe(png);
  });
});
