import { SsoService } from '@enem-landing/backend-sso';
import { Role } from '@enem-landing/shared-definitions';
import {
  Controller,
  Get,
  type INestApplication,
  Module,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module.js';
import { HealthController } from '../health/health.controller.js';
import { AuthModule } from './auth.module.js';
import { IS_PUBLIC_METADATA, Public } from './public.decorator.js';

/** A brand-new controller with no auth decorators at all. */
@Controller('brand-new')
class BrandNewController {
  @Get()
  get() {
    return { ok: true };
  }
}

@Controller('open')
class OpenController {
  @Public()
  @Get()
  get() {
    return { ok: true };
  }
}

@Module({
  imports: [AuthModule],
  controllers: [BrandNewController, OpenController],
})
class TestModule {}

const USERS: Record<string, Role> = {
  'super-token': Role.SuperAdmin,
  'admin-token': Role.Admin,
  'user-token': Role.User,
};

describe('SuperAdminGuard (global)', () => {
  let app: INestApplication;
  let base: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestModule] })
      .overrideProvider(SsoService)
      .useValue({
        extractToken: (req: { headers: { authorization?: string } }) => {
          const header = req.headers.authorization;
          if (!header?.startsWith('Bearer '))
            throw new UnauthorizedException('Token is required');
          return header.slice('Bearer '.length);
        },
        whoAmI: async (token: string) => {
          const role = USERS[token];
          if (!role) throw new UnauthorizedException();
          return {
            statusCode: 200,
            message: 'Success',
            data: { id: '1', fullname: 'X', email: 'x@example.com', role },
          };
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
  });

  afterAll(() => app.close());

  const status = async (path: string, token?: string) =>
    (
      await fetch(`${base}${path}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      })
    ).status;

  it('protects a new endpoint without any decorator', async () => {
    expect(await status('/brand-new')).toBe(401);
    expect(await status('/brand-new', 'bogus')).toBe(401);
    expect(await status('/brand-new', 'user-token')).toBe(403);
    expect(await status('/brand-new', 'admin-token')).toBe(403);
    expect(await status('/brand-new', 'super-token')).toBe(200);
  });

  it('lets @Public() routes through without a token', async () => {
    expect(await status('/open')).toBe(200);
  });
});

// Nest's own module metadata keys (`MODULE_METADATA` in @nestjs/common/constants).
const MODULE_METADATA = {
  IMPORTS: 'imports',
  CONTROLLERS: 'controllers',
} as const;

/** Walks the real module tree so a stray @Public() can't slip in unnoticed. */
const collectControllers = (
  module: unknown,
  seen = new Set<unknown>(),
): Array<new (...args: never[]) => unknown> => {
  if (!module || seen.has(module)) return [];
  seen.add(module);
  const imports = (Reflect.getMetadata(
    MODULE_METADATA.IMPORTS,
    module as object,
  ) ?? []) as unknown[];
  const controllers = (Reflect.getMetadata(
    MODULE_METADATA.CONTROLLERS,
    module as object,
  ) ?? []) as Array<new (...args: never[]) => unknown>;
  return [
    ...controllers,
    ...imports.flatMap((child) => collectControllers(child, seen)),
  ];
};

describe('public routes in AppModule', () => {
  it('only exposes GET /health and the alert webhook without the SuperAdmin guard', () => {
    const publicRoutes: string[] = [];
    for (const controller of collectControllers(AppModule)) {
      const classPublic =
        Reflect.getMetadata(IS_PUBLIC_METADATA, controller) === true;
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        if (name === 'constructor') continue;
        const handler = (controller.prototype as Record<string, unknown>)[name];
        if (typeof handler !== 'function') continue;
        if (
          classPublic ||
          Reflect.getMetadata(IS_PUBLIC_METADATA, handler) === true
        ) {
          publicRoutes.push(`${controller.name}.${name}`);
        }
      }
    }
    expect(collectControllers(AppModule)).toContain(HealthController);
    // The webhook checks its own per-hook key (X-Webhook-Key) instead.
    expect(publicRoutes.sort()).toEqual([
      'HealthController.check',
      'HooksController.receive',
    ]);
  });
});
