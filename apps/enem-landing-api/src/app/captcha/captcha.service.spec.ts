import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptchaService } from './captcha.service.js';

describe('CaptchaService', () => {
  let store: Map<string, string>;
  let redis: {
    setValue: ReturnType<typeof vi.fn>;
    takeValue: ReturnType<typeof vi.fn>;
  };
  let service: CaptchaService;

  beforeEach(() => {
    store = new Map();
    redis = {
      setValue: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      takeValue: vi.fn(async (key: string) => {
        const value = store.get(key) ?? null;
        store.delete(key);
        return value;
      }),
    };
    service = new CaptchaService(redis as never);
  });

  afterEach(() => {
    delete process.env['CAPTCHA_ENABLED'];
  });

  const storedX = (id: string): number =>
    (JSON.parse(store.get(`captcha:challenge:${id}`) ?? '{}') as { x: number })
      .x;

  const solvedTrail = (x: number): [number, number, number][] => [
    [0, 0, 0],
    [x * 0.1, 1, 60],
    [x * 0.4, 2, 150],
    [x * 0.8, 1, 300],
    [x * 0.97, 1, 420],
    [x, 0, 520],
  ];

  it('serves a puzzle without revealing the answer', async () => {
    const challenge = await service.createChallenge();
    expect(challenge.enabled).toBe(true);
    if (!challenge.enabled) return;
    expect(challenge.background.startsWith('data:image/png;base64,')).toBe(
      true,
    );
    expect(challenge.piece.startsWith('data:image/png;base64,')).toBe(true);
    expect(JSON.stringify(challenge)).not.toContain('"x"');
  });

  it('issues a single-use token for a correct answer', async () => {
    const challenge = await service.createChallenge();
    if (!challenge.enabled) throw new Error('expected enabled');
    const x = storedX(challenge.id);

    const { token } = await service.verify({
      id: challenge.id,
      x,
      durationMs: 520,
      trail: solvedTrail(x),
    });

    await expect(service.consumeToken(token)).resolves.toBe(true);
    await expect(service.consumeToken(token)).resolves.toBe(false);
  });

  it('burns the challenge on a wrong answer', async () => {
    const challenge = await service.createChallenge();
    if (!challenge.enabled) throw new Error('expected enabled');
    const x = storedX(challenge.id);

    await expect(
      service.verify({
        id: challenge.id,
        x: x + 40,
        durationMs: 520,
        trail: solvedTrail(x + 40),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.verify({
        id: challenge.id,
        x,
        durationMs: 520,
        trail: solvedTrail(x),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing token, and allows everything when disabled', async () => {
    await expect(service.consumeToken(undefined)).resolves.toBe(false);
    process.env['CAPTCHA_ENABLED'] = 'false';
    await expect(service.createChallenge()).resolves.toEqual({
      enabled: false,
    });
    await expect(service.consumeToken(undefined)).resolves.toBe(true);
  });
});
