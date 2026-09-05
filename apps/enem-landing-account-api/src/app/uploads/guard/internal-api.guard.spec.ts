import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { InternalApiGuard } from './internal-api.guard.js';

const buildContext = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  }) as unknown as ExecutionContext;

describe('InternalApiGuard', () => {
  const guard = new InternalApiGuard();
  const originalKey = process.env['INTERNAL_API_KEY'];

  beforeEach(() => {
    process.env['INTERNAL_API_KEY'] = 'test-secret';
  });

  afterEach(() => {
    process.env['INTERNAL_API_KEY'] = originalKey;
  });

  it('rejects a request with no key header', () => {
    expect(() => guard.canActivate(buildContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request with the wrong key', () => {
    expect(() =>
      guard.canActivate(buildContext({ 'x-internal-api-key': 'wrong' })),
    ).toThrow(UnauthorizedException);
  });

  it('rejects every request when INTERNAL_API_KEY is not configured server-side', () => {
    delete process.env['INTERNAL_API_KEY'];
    expect(() =>
      guard.canActivate(buildContext({ 'x-internal-api-key': 'test-secret' })),
    ).toThrow(UnauthorizedException);
  });

  it('allows a request with the correct key', () => {
    expect(
      guard.canActivate(buildContext({ 'x-internal-api-key': 'test-secret' })),
    ).toBe(true);
  });
});
