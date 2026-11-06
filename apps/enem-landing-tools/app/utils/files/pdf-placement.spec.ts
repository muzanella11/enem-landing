import { describe, expect, it } from 'vitest';
import {
  displayToUser,
  normalizeRotation,
  pilihHalaman,
  placeRect,
  placeText,
  type PageBox,
} from './pdf-placement.js';

const box = (rotation: number): PageBox => ({
  x: 0,
  y: 0,
  width: 600,
  height: 800,
  rotation,
});

describe('displayToUser', () => {
  it('maps the displayed top-left corner for every rotation', () => {
    expect(displayToUser(box(0), 0, 0)).toEqual({ x: 0, y: 800 });
    // Rotated 90 clockwise: user bottom-left is shown top-left.
    expect(displayToUser(box(90), 0, 0)).toEqual({ x: 0, y: 0 });
    expect(displayToUser(box(180), 0, 0)).toEqual({ x: 600, y: 0 });
    expect(displayToUser(box(270), 0, 0)).toEqual({ x: 600, y: 800 });
  });

  it('respects the crop box origin', () => {
    expect(displayToUser({ ...box(0), x: 10, y: 20 }, 0, 0)).toEqual({
      x: 10,
      y: 820,
    });
  });
});

describe('placeRect', () => {
  it('unrotated: bottom-right quarter', () => {
    expect(placeRect(box(0), { x: 0.5, y: 0.5, w: 0.5, h: 0.5 })).toEqual({
      x: 300,
      y: 0,
      width: 300,
      height: 400,
      rotate: 0,
    });
  });

  it('rotated 90: displayed page is 800 wide, 600 tall', () => {
    // Displayed bottom-left corner of the whole page = user bottom-right... of
    // the rotated frame: (dx 0, dy 600) -> user (600, 0).
    expect(placeRect(box(90), { x: 0, y: 0, w: 1, h: 1 })).toEqual({
      x: 600,
      y: 0,
      width: 800,
      height: 600,
      rotate: 90,
    });
  });

  it('every rotation keeps the full-page rectangle on the page', () => {
    for (const rotation of [0, 90, 180, 270]) {
      const placed = placeRect(box(rotation), { x: 0, y: 0, w: 1, h: 1 });
      expect(placed.x).toBeGreaterThanOrEqual(0);
      expect(placed.x).toBeLessThanOrEqual(600);
      expect(placed.y).toBeGreaterThanOrEqual(0);
      expect(placed.y).toBeLessThanOrEqual(800);
    }
  });
});

describe('placeText', () => {
  it('horizontal text centered on an unrotated page', () => {
    const placed = placeText(box(0), 0.5, 0.5, 100, 20, 0);
    expect(placed.x).toBeCloseTo(250);
    expect(placed.y).toBeCloseTo(390);
    expect(placed.rotate).toBe(0);
  });

  it('adds the page rotation', () => {
    expect(placeText(box(90), 0.5, 0.5, 100, 20, 45).rotate).toBe(135);
  });
});

describe('helpers', () => {
  it('normalizes rotation', () => {
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(450)).toBe(90);
  });

  it('picks pages', () => {
    expect(pilihHalaman('semua', 3)).toEqual([0, 1, 2]);
    expect(
      pilihHalaman(
        [
          [3, 1],
          [1, 2],
        ],
        5,
      ),
    ).toEqual([0, 1, 2]);
  });
});
