import { describe, expect, it } from 'vitest';
import { encodePng } from './png-encoder.js';
import {
  PIECE_SIZE,
  PUZZLE_HEIGHT,
  PUZZLE_WIDTH,
  renderPuzzle,
} from './puzzle-renderer.js';

describe('renderPuzzle', () => {
  it('places the hole inside the image and away from the start', () => {
    for (let run = 0; run < 50; run += 1) {
      const { x, y, background, piece } = renderPuzzle();
      expect(x).toBeGreaterThanOrEqual(PIECE_SIZE + 20);
      expect(x + PIECE_SIZE).toBeLessThanOrEqual(PUZZLE_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y + PIECE_SIZE).toBeLessThanOrEqual(PUZZLE_HEIGHT);
      expect(background).toHaveLength(PUZZLE_WIDTH * PUZZLE_HEIGHT * 4);
      expect(piece).toHaveLength(PIECE_SIZE * PIECE_SIZE * 4);
    }
  });

  it('cuts a piece with transparent corners and an opaque body', () => {
    const { piece } = renderPuzzle();
    const alphaAt = (px: number, py: number) =>
      piece[(py * PIECE_SIZE + px) * 4 + 3];
    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(PIECE_SIZE / 2, PIECE_SIZE / 2)).toBe(255);
  });
});

describe('encodePng', () => {
  it('writes a valid PNG header', () => {
    const png = encodePng(2, 1, new Uint8ClampedArray(8));
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(1);
  });
});
