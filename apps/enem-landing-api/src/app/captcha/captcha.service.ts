import { RedisService } from '@enem-landing/backend-redis';
import type {
  CaptchaChallenge,
  CaptchaVerifyInput,
} from '@enem-landing/shared-types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { verifyDrag } from './captcha-verification.js';
import { toPngDataUrl } from './png-encoder.js';
import {
  PIECE_SIZE,
  PUZZLE_HEIGHT,
  PUZZLE_WIDTH,
  renderPuzzle,
} from './puzzle-renderer.js';

const CHALLENGE_TTL_SECONDS = 120;
const TOKEN_TTL_SECONDS = 300;

/** Shown to the visitor; never says which check failed. */
export const CAPTCHA_FAILED_MESSAGE =
  'captchaToken puzzle not solved - please try again';

/**
 * Self-hosted slider captcha for the contact form: the visitor drags a
 * puzzle piece into its hole. A solved challenge yields a single-use token
 * the contact submission must carry.
 *
 * `CAPTCHA_ENABLED=false` turns it off (e2e runs only).
 */
@Injectable()
export class CaptchaService {
  constructor(private readonly redisService: RedisService) {}

  get enabled(): boolean {
    return process.env['CAPTCHA_ENABLED'] !== 'false';
  }

  async createChallenge(): Promise<CaptchaChallenge> {
    if (!this.enabled) return { enabled: false };

    const puzzle = renderPuzzle();
    const id = randomUUID();
    await this.redisService.setValue(
      this.challengeKey(id),
      JSON.stringify({ x: puzzle.x }),
      CHALLENGE_TTL_SECONDS,
    );

    return {
      enabled: true,
      id,
      width: PUZZLE_WIDTH,
      height: PUZZLE_HEIGHT,
      pieceSize: PIECE_SIZE,
      pieceY: puzzle.y,
      background: toPngDataUrl(PUZZLE_WIDTH, PUZZLE_HEIGHT, puzzle.background),
      piece: toPngDataUrl(PIECE_SIZE, PIECE_SIZE, puzzle.piece),
      expiresInSeconds: CHALLENGE_TTL_SECONDS,
    };
  }

  /** One attempt per challenge: a wrong answer means a fresh puzzle. */
  async verify(input: CaptchaVerifyInput): Promise<{ token: string }> {
    const stored = await this.redisService.takeValue(
      this.challengeKey(input.id),
    );
    if (!stored) throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);

    const { x: expectedX } = JSON.parse(stored) as { x: number };
    const verdict = verifyDrag({ expectedX, ...input });
    if (!verdict.ok) throw new BadRequestException(CAPTCHA_FAILED_MESSAGE);

    const token = randomBytes(24).toString('hex');
    await this.redisService.setValue(
      this.tokenKey(token),
      '1',
      TOKEN_TTL_SECONDS,
    );
    return { token };
  }

  /** True once per solved puzzle; always true while the captcha is off. */
  async consumeToken(token: string | undefined): Promise<boolean> {
    if (!this.enabled) return true;
    if (!token) return false;
    return (await this.redisService.takeValue(this.tokenKey(token))) !== null;
  }

  private challengeKey(id: string) {
    return `captcha:challenge:${id}`;
  }

  private tokenKey(token: string) {
    return `captcha:token:${token}`;
  }
}
