import { HttpException, UseGuards } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimit, SkipRateLimit } from './rate-limit.decorator.js';
import { RateLimitGuard } from './rate-limit.guard.js';

class FakeAuthGuard {
  canActivate() {
    return true;
  }
}

class SampleController {
  read() {
    return null;
  }
  write() {
    return null;
  }
  @RateLimit('auth')
  signin() {
    return null;
  }
  @UseGuards(FakeAuthGuard)
  adminOnly() {
    return null;
  }
  @SkipRateLimit()
  health() {
    return null;
  }
}

const buildContext = (
  handler: keyof SampleController,
  request: Partial<{
    method: string;
    ip: string;
    headers: Record<string, string>;
    path: string;
  }>,
) => {
  const setHeader = vi.fn();
  const context = {
    getType: () => 'http',
    getHandler: () => SampleController.prototype[handler],
    getClass: () => SampleController,
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        ip: '203.0.113.7',
        path: '/x',
        headers: { 'x-forwarded-for': '203.0.113.7' },
        ...request,
      }),
      getResponse: () => ({ setHeader }),
    }),
  } as unknown as ExecutionContext;
  return { context, setHeader };
};

describe('RateLimitGuard', () => {
  let redis: { incrementWindow: ReturnType<typeof vi.fn> };
  let guard: RateLimitGuard;

  beforeEach(() => {
    redis = {
      incrementWindow: vi.fn().mockResolvedValue({ count: 1, ttlMs: 60_000 }),
    };
    guard = new RateLimitGuard(new Reflector(), redis as never);
  });

  afterEach(() => {
    delete process.env['RATE_LIMIT_MULTIPLIER'];
    delete process.env['RATE_LIMIT_DISABLED'];
    delete process.env['INTERNAL_API_KEY'];
  });

  const tierOf = () =>
    (redis.incrementWindow.mock.calls[0][0] as string).split(':')[1];

  it('uses the default tier for a public GET', async () => {
    await expect(
      guard.canActivate(buildContext('read', {}).context),
    ).resolves.toBe(true);
    expect(tierOf()).toBe('default');
    expect(redis.incrementWindow).toHaveBeenCalledWith(
      'rate-limit:default:60000:ip:203.0.113.7',
      60_000,
    );
  });

  it('uses the write tier for a public POST', async () => {
    await guard.canActivate(buildContext('write', { method: 'POST' }).context);
    expect(tierOf()).toBe('write');
  });

  it('honours an explicit tier and checks every window', async () => {
    await guard.canActivate(buildContext('signin', { method: 'POST' }).context);
    expect(tierOf()).toBe('auth');
    expect(redis.incrementWindow).toHaveBeenCalledTimes(2);
  });

  it('treats a route with its own auth guard as admin', async () => {
    await guard.canActivate(
      buildContext('adminOnly', { method: 'PATCH' }).context,
    );
    expect(tierOf()).toBe('admin');
  });

  it('skips @SkipRateLimit routes and valid internal calls', async () => {
    await expect(
      guard.canActivate(buildContext('health', {}).context),
    ).resolves.toBe(true);
    process.env['INTERNAL_API_KEY'] = 'secret';
    await expect(
      guard.canActivate(
        buildContext('write', {
          method: 'POST',
          headers: { 'x-internal-api-key': 'secret' },
        }).context,
      ),
    ).resolves.toBe(true);
    expect(redis.incrementWindow).not.toHaveBeenCalled();
  });

  it('counts service-to-service calls without a visitor IP as internal', async () => {
    await guard.canActivate(
      buildContext('write', {
        method: 'POST',
        ip: '::ffff:10.0.1.7',
        headers: {},
      }).context,
    );
    expect(redis.incrementWindow).toHaveBeenCalledWith(
      'rate-limit:internal:60000:internal:10.0.1.7',
      60_000,
    );
  });

  it('rejects with 429 and Retry-After once over the limit', async () => {
    redis.incrementWindow.mockResolvedValue({ count: 121, ttlMs: 12_300 });
    const { context, setHeader } = buildContext('read', {});
    const error = await guard
      .canActivate(context)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '13');
  });

  it('scales limits with RATE_LIMIT_MULTIPLIER', async () => {
    process.env['RATE_LIMIT_MULTIPLIER'] = '10';
    redis.incrementWindow.mockResolvedValue({ count: 121, ttlMs: 1_000 });
    await expect(
      guard.canActivate(buildContext('read', {}).context),
    ).resolves.toBe(true);
  });

  it('can be disabled entirely', async () => {
    process.env['RATE_LIMIT_DISABLED'] = 'true';
    await expect(
      guard.canActivate(buildContext('read', {}).context),
    ).resolves.toBe(true);
    expect(redis.incrementWindow).not.toHaveBeenCalled();
  });

  it('fails open when Redis is unavailable', async () => {
    redis.incrementWindow.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(
      guard.canActivate(buildContext('read', {}).context),
    ).resolves.toBe(true);
  });
});
