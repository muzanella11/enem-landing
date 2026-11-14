/** How far (px) the dropped piece may sit from the hole. */
export const CAPTCHA_TOLERANCE_PX = 4;
/** Faster than this is not a human drag. */
export const CAPTCHA_MIN_DRAG_MS = 300;
export const CAPTCHA_MAX_DRAG_MS = 60_000;
const MIN_TRAIL_POINTS = 5;

export interface DragAttempt {
  expectedX: number;
  x: number;
  durationMs: number;
  /** `[x, y, t]` samples of the drag. */
  trail: [number, number, number][];
}

export type DragVerdict = { ok: true } | { ok: false; reason: string };

const spread = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length,
  );
};

/**
 * Checks a slider-captcha answer: the piece must land on the hole, and the
 * drag must look like a person moved it. A scripted drag tends to be one
 * jump or a perfectly even sweep (same step, same interval, no vertical
 * wobble); a hand drag, or keyboard nudges with uneven timing, is not.
 */
export const verifyDrag = ({
  expectedX,
  x,
  durationMs,
  trail,
}: DragAttempt): DragVerdict => {
  if (Math.abs(x - expectedX) > CAPTCHA_TOLERANCE_PX) {
    return { ok: false, reason: 'position' };
  }
  if (durationMs < CAPTCHA_MIN_DRAG_MS || durationMs > CAPTCHA_MAX_DRAG_MS) {
    return { ok: false, reason: 'duration' };
  }
  if (trail.length < MIN_TRAIL_POINTS) {
    return { ok: false, reason: 'trail' };
  }
  const last = trail[trail.length - 1];
  if (Math.abs(last[0] - x) > CAPTCHA_TOLERANCE_PX) {
    return { ok: false, reason: 'trail' };
  }

  const dx: number[] = [];
  const dy: number[] = [];
  const dt: number[] = [];
  for (let index = 1; index < trail.length; index += 1) {
    dx.push(trail[index][0] - trail[index - 1][0]);
    dy.push(trail[index][1] - trail[index - 1][1]);
    dt.push(trail[index][2] - trail[index - 1][2]);
  }
  const uniform =
    spread(dx) < 0.5 && spread(dt) < 2 && dy.every((value) => value === 0);
  if (uniform) return { ok: false, reason: 'robotic' };

  return { ok: true };
};
