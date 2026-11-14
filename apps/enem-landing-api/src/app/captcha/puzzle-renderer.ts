import { randomInt } from 'node:crypto';

export const PUZZLE_WIDTH = 300;
export const PUZZLE_HEIGHT = 160;
/** Side of the square body of the piece. */
const BODY = 40;
/** Radius of the tabs sticking out of the piece. */
const TAB = 8;
/** The piece image is the body plus room for a tab on every side. */
export const PIECE_SIZE = BODY + TAB * 2;

export interface RenderedPuzzle {
  /** Correct left offset of the piece image. */
  x: number;
  /** Top offset of the piece image (shown to the client). */
  y: number;
  background: Uint8ClampedArray;
  piece: Uint8ClampedArray;
}

type Rgb = [number, number, number];

/** Muted teal/slate tones, close to the site's palette. */
const PALETTE: Rgb[] = [
  [14, 124, 107],
  [44, 62, 80],
  [72, 160, 145],
  [120, 144, 156],
  [230, 168, 92],
  [196, 214, 208],
  [95, 108, 175],
  [210, 120, 110],
];

const pick = <T>(items: T[]): T => items[randomInt(items.length)];

/**
 * Jigsaw piece shape in piece-image coordinates: a square body with a tab
 * on top and on the right, and a socket on the left.
 */
const insidePiece = (px: number, py: number): boolean => {
  const inCircle = (cx: number, cy: number, r: number) =>
    (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  const inBody = px >= TAB && px < TAB + BODY && py >= TAB && py < TAB + BODY;
  const topTab = inCircle(TAB + BODY / 2, TAB, TAB);
  const rightTab = inCircle(TAB + BODY, TAB + BODY / 2, TAB);
  const leftSocket = inCircle(TAB, TAB + BODY / 2, TAB * 0.85);
  return (inBody && !leftSocket) || topTab || rightTab;
};

const buildMask = (): boolean[] => {
  const mask: boolean[] = [];
  for (let py = 0; py < PIECE_SIZE; py += 1) {
    for (let px = 0; px < PIECE_SIZE; px += 1) mask.push(insidePiece(px, py));
  }
  return mask;
};

const PIECE_MASK = buildMask();

const isEdge = (px: number, py: number): boolean => {
  if (!PIECE_MASK[py * PIECE_SIZE + px]) return false;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = px + dx;
    const ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= PIECE_SIZE || ny >= PIECE_SIZE) return true;
    if (!PIECE_MASK[ny * PIECE_SIZE + nx]) return true;
  }
  return false;
};

/** Random abstract scene: gradient, soft circles and bars, plus noise. */
const paintBackground = (): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(PUZZLE_WIDTH * PUZZLE_HEIGHT * 4);
  const from = pick(PALETTE);
  const to = pick(PALETTE);
  const angle = randomInt(360) * (Math.PI / 180);
  const shapes = Array.from({ length: 14 }, () => ({
    kind: randomInt(3),
    cx: randomInt(PUZZLE_WIDTH),
    cy: randomInt(PUZZLE_HEIGHT),
    r: 12 + randomInt(40),
    w: 20 + randomInt(80),
    h: 8 + randomInt(30),
    color: pick(PALETTE),
    alpha: 0.25 + randomInt(45) / 100,
  }));

  for (let y = 0; y < PUZZLE_HEIGHT; y += 1) {
    for (let x = 0; x < PUZZLE_WIDTH; x += 1) {
      const t =
        ((x / PUZZLE_WIDTH) * Math.cos(angle) +
          (y / PUZZLE_HEIGHT) * Math.sin(angle) +
          1) /
        2;
      let r = from[0] + (to[0] - from[0]) * t;
      let g = from[1] + (to[1] - from[1]) * t;
      let b = from[2] + (to[2] - from[2]) * t;

      for (const shape of shapes) {
        const hit =
          shape.kind === 0
            ? (x - shape.cx) ** 2 + (y - shape.cy) ** 2 <= shape.r ** 2
            : shape.kind === 1
              ? Math.abs(x - shape.cx) <= shape.w / 2 &&
                Math.abs(y - shape.cy) <= shape.h / 2
              : Math.abs(x - shape.cx) + Math.abs(y - shape.cy) <= shape.r;
        if (hit) {
          r += (shape.color[0] - r) * shape.alpha;
          g += (shape.color[1] - g) * shape.alpha;
          b += (shape.color[2] - b) * shape.alpha;
        }
      }

      const noise = randomInt(21) - 10;
      const offset = (y * PUZZLE_WIDTH + x) * 4;
      pixels[offset] = r + noise;
      pixels[offset + 1] = g + noise;
      pixels[offset + 2] = b + noise;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
};

/**
 * Draws a new slider puzzle: a background with a piece-shaped hole, and the
 * matching piece cut from the same spot. The client only ever gets the two
 * images and the piece's vertical offset; the hole's horizontal position
 * stays on the server.
 */
export const renderPuzzle = (): RenderedPuzzle => {
  const scene = paintBackground();
  const minX = PIECE_SIZE + 20;
  const x = minX + randomInt(PUZZLE_WIDTH - PIECE_SIZE - 6 - minX);
  const y = 6 + randomInt(PUZZLE_HEIGHT - PIECE_SIZE - 12);

  const background = new Uint8ClampedArray(scene);
  const piece = new Uint8ClampedArray(PIECE_SIZE * PIECE_SIZE * 4);

  for (let py = 0; py < PIECE_SIZE; py += 1) {
    for (let px = 0; px < PIECE_SIZE; px += 1) {
      if (!PIECE_MASK[py * PIECE_SIZE + px]) continue;
      const source = ((y + py) * PUZZLE_WIDTH + (x + px)) * 4;
      const target = (py * PIECE_SIZE + px) * 4;
      const edge = isEdge(px, py);

      // Piece: the scene pixel, with a light outline.
      for (let channel = 0; channel < 3; channel += 1) {
        piece[target + channel] = edge ? 255 : scene[source + channel];
      }
      piece[target + 3] = edge ? 235 : 255;

      // Hole: darkened scene, with a faint outline.
      for (let channel = 0; channel < 3; channel += 1) {
        background[source + channel] = edge
          ? scene[source + channel] * 0.4 + 255 * 0.6
          : scene[source + channel] * 0.45;
      }
    }
  }

  return { x, y, background, piece };
};
