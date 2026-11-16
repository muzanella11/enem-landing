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

interface Theme {
  skyTop: Rgb;
  skyBottom: Rgb;
  sun: Rgb;
  /** Farthest ridge first, nearest last. */
  ridges: Rgb[];
  stars: boolean;
}

/** Times of day for the landscape scene. */
const THEMES: Theme[] = [
  {
    // Dawn
    skyTop: [94, 117, 178],
    skyBottom: [250, 196, 160],
    sun: [255, 236, 200],
    ridges: [
      [176, 150, 170],
      [120, 104, 140],
      [72, 66, 104],
      [38, 40, 66],
    ],
    stars: false,
  },
  {
    // Clear day, close to the site's teal
    skyTop: [74, 154, 214],
    skyBottom: [200, 232, 240],
    sun: [255, 250, 220],
    ridges: [
      [150, 196, 196],
      [72, 160, 145],
      [14, 124, 107],
      [10, 78, 70],
    ],
    stars: false,
  },
  {
    // Sunset
    skyTop: [58, 48, 110],
    skyBottom: [250, 150, 90],
    sun: [255, 214, 140],
    ridges: [
      [196, 110, 110],
      [140, 70, 96],
      [86, 44, 80],
      [40, 24, 50],
    ],
    stars: false,
  },
  {
    // Night
    skyTop: [12, 18, 44],
    skyBottom: [44, 74, 120],
    sun: [236, 240, 255],
    ridges: [
      [60, 84, 122],
      [40, 60, 96],
      [26, 40, 70],
      [12, 22, 42],
    ],
    stars: true,
  },
  {
    // Autumn afternoon
    skyTop: [110, 160, 200],
    skyBottom: [244, 224, 180],
    sun: [255, 244, 210],
    ridges: [
      [200, 170, 120],
      [214, 130, 70],
      [160, 80, 50],
      [80, 44, 34],
    ],
    stars: false,
  },
];

const pick = <T>(items: T[]): T => items[randomInt(items.length)];
const random = () => randomInt(1_000_000) / 1_000_000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/**
 * Jigsaw piece shape in piece-image coordinates (fractional, so the edge
 * can be anti-aliased): a square body with a tab on top and on the right,
 * and a socket on the left.
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

const SUBSAMPLES = 4;

/** Share (0-1) of the pixel at (px, py) covered by the piece shape. */
const coverageAt = (px: number, py: number): number => {
  let hits = 0;
  for (let sy = 0; sy < SUBSAMPLES; sy += 1) {
    for (let sx = 0; sx < SUBSAMPLES; sx += 1) {
      if (
        insidePiece(px + (sx + 0.5) / SUBSAMPLES, py + (sy + 0.5) / SUBSAMPLES)
      ) {
        hits += 1;
      }
    }
  }
  return hits / SUBSAMPLES ** 2;
};

interface PieceShading {
  coverage: number;
  /** Near the outline (0-1), for the light rim. */
  rim: number;
  /** -1 (shadow side) to 1 (lit side), for the bevel. */
  bevel: number;
}

const shadePixel = (px: number, py: number): PieceShading => {
  const coverage = coverageAt(px, py);
  if (coverage === 0) return { coverage, rim: 0, bevel: 0 };
  const cx = px + 0.5;
  const cy = py + 0.5;

  // Rim: any point within ~1.5px outside the shape.
  let outside = 0;
  const directions = 12;
  for (let index = 0; index < directions; index += 1) {
    const angle = (index / directions) * Math.PI * 2;
    if (!insidePiece(cx + Math.cos(angle) * 1.5, cy + Math.sin(angle) * 1.5)) {
      outside += 1;
    }
  }
  const rim = coverage < 1 ? 1 : Math.min(1, (outside / directions) * 3);

  // Bevel: light from the top-left, a few px deep.
  let bevel = 0;
  for (const depth of [1.5, 3, 4.5]) {
    const weight = 1 - depth / 6;
    if (!insidePiece(cx - depth, cy - depth)) bevel += weight;
    if (!insidePiece(cx + depth, cy + depth)) bevel -= weight;
  }
  return { coverage, rim, bevel: Math.max(-1, Math.min(1, bevel)) };
};

const PIECE_SHADING: PieceShading[] = [];
for (let py = 0; py < PIECE_SIZE; py += 1) {
  for (let px = 0; px < PIECE_SIZE; px += 1) {
    PIECE_SHADING.push(shadePixel(px, py));
  }
}

/** Ridge line: a few layered waves with random phases. */
const makeRidge = (base: number, amplitude: number) => {
  const waves = Array.from({ length: 4 }, (_, index) => ({
    frequency: (0.008 + random() * 0.01) * (index + 1) ** 1.6,
    phase: random() * Math.PI * 2,
    weight: amplitude / (index + 1) ** 1.3,
  }));
  return (x: number) =>
    base +
    waves.reduce(
      (sum, wave) =>
        sum + Math.sin(x * wave.frequency + wave.phase) * wave.weight,
      0,
    );
};

/**
 * Random landscape scene: sky gradient, sun or moon with a glow, soft
 * clouds (or stars at night) and layered mountain ridges with haze.
 */
const paintBackground = (): Uint8ClampedArray => {
  const pixels = new Uint8ClampedArray(PUZZLE_WIDTH * PUZZLE_HEIGHT * 4);
  const theme = pick(THEMES);
  const sun = {
    x: 30 + random() * (PUZZLE_WIDTH - 60),
    y: 18 + random() * 40,
    r: 9 + random() * 8,
  };
  const clouds = theme.stars
    ? []
    : Array.from({ length: 2 + randomInt(4) }, () => ({
        x: random() * PUZZLE_WIDTH,
        y: 10 + random() * 60,
        rx: 22 + random() * 40,
        ry: 5 + random() * 7,
        alpha: 0.35 + random() * 0.35,
      }));
  const stars = theme.stars
    ? Array.from({ length: 70 }, () => ({
        x: randomInt(PUZZLE_WIDTH),
        y: randomInt(Math.round(PUZZLE_HEIGHT * 0.65)),
        brightness: 0.3 + random() * 0.7,
      }))
    : [];
  const starAt = new Map(
    stars.map((star) => [star.y * PUZZLE_WIDTH + star.x, star]),
  );

  const layers = theme.ridges.map((color, index) => ({
    color,
    height: makeRidge(
      PUZZLE_HEIGHT * (0.42 + index * 0.13),
      10 + index * 4 + random() * 8,
    ),
  }));
  const ridgeHeights = layers.map((layer) =>
    Array.from({ length: PUZZLE_WIDTH }, (_, x) => layer.height(x)),
  );

  for (let y = 0; y < PUZZLE_HEIGHT; y += 1) {
    for (let x = 0; x < PUZZLE_WIDTH; x += 1) {
      let color = mix(theme.skyTop, theme.skyBottom, y / PUZZLE_HEIGHT);

      const star = starAt.get(y * PUZZLE_WIDTH + x);
      if (star) color = mix(color, [255, 255, 255], star.brightness);

      const sunDistance = Math.hypot(x - sun.x, y - sun.y);
      const glow = clamp01(1 - sunDistance / (sun.r * 4)) ** 2 * 0.55;
      color = mix(color, theme.sun, glow);
      color = mix(color, theme.sun, clamp01(sun.r + 0.5 - sunDistance));

      for (const cloud of clouds) {
        const d =
          ((x - cloud.x) / cloud.rx) ** 2 + ((y - cloud.y) / cloud.ry) ** 2;
        if (d < 1)
          color = mix(color, [255, 255, 255], (1 - d) ** 1.5 * cloud.alpha);
      }

      for (let index = 0; index < layers.length; index += 1) {
        const top = ridgeHeights[index][x];
        const coverage = clamp01(y - top + 0.5);
        if (coverage === 0) continue;
        // Darker lower down a ridge, lit slightly along its crest.
        const depth = clamp01((y - top) / 50);
        const shade = mix(layers[index].color, [0, 0, 0], depth * 0.25);
        const crest = clamp01(1 - (y - top) / 3) * 0.12;
        color = mix(color, mix(shade, theme.sun, crest), coverage);
      }

      const noise = (random() - 0.5) * 8;
      const offset = (y * PUZZLE_WIDTH + x) * 4;
      pixels[offset] = color[0] + noise;
      pixels[offset + 1] = color[1] + noise;
      pixels[offset + 2] = color[2] + noise;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
};

/**
 * Draws a new slider puzzle: a landscape with a piece-shaped hole, and the
 * matching piece cut from the same spot. The piece gets a bevel and a light
 * rim, the hole a dark inset with an inner shadow. The client only ever
 * gets the two images and the piece's vertical offset; the hole's
 * horizontal position stays on the server.
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
      const { coverage, rim, bevel } = PIECE_SHADING[py * PIECE_SIZE + px];
      if (coverage === 0) continue;
      const source = ((y + py) * PUZZLE_WIDTH + (x + px)) * 4;
      const target = (py * PIECE_SIZE + px) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const value = scene[source + channel];

        // Piece: the scene, bevelled, with a soft white rim.
        const lit =
          bevel >= 0
            ? lerp(value, 255, bevel * 0.45)
            : lerp(value, 0, -bevel * 0.4);
        piece[target + channel] = lerp(lit, 255, rim * 0.75);

        // Hole: dark inset, deeper where the top-left edge casts shadow,
        // with a faint light rim; blended by edge coverage.
        const inset =
          value * (bevel > 0 ? 0.32 - 0.14 * bevel : 0.32 - 0.1 * bevel);
        const hole = lerp(inset, 255, rim * 0.35);
        background[source + channel] = lerp(value, hole, coverage);
      }
      piece[target + 3] = Math.round(coverage * 255);
    }
  }

  return { x, y, background, piece };
};
