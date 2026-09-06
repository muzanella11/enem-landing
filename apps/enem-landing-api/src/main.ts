import 'reflect-metadata';
import './load-env.js';
import { AllExceptionsFilter } from '@enem-landing/backend-utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env['PORT'] || 3001;
  const corsOrigin = process.env['CORS_ORIGIN'];

  // Trust exactly one hop. This app is internal-only (traefik.enable=false
  // in compose.yml, never hit by Traefik directly) - its one real hop is
  // enem-landing-web/-cms's own BFF server route proxying the request over
  // the internal Docker network, which forwards the visitor's real IP via
  // an `X-Forwarded-For` header (see e.g. enem-landing-web's
  // server/api/tracking/session.post.ts). Without both that header being
  // sent AND this trust-proxy setting, `req.ip` here resolves to the
  // calling BFF container's own Docker-network address instead of the
  // visitor's - which is what happened before the header was added (every
  // tracked session got the same non-routable `::ffff:10.x.x.x` IP).
  // Affects both the tracking module and contact-submissions' existing
  // per-IP rate limiter.
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',') : true,
    credentials: true,
  });

  await app.listen(port);
  Logger.log(`🚀 enem-landing-api is running on: http://localhost:${port}`);
}

bootstrap();
