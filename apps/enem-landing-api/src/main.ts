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

  // This app is internal-only (traefik.enable=false in compose.yml): every
  // request comes from a BFF server route over the internal Docker network,
  // which forwards the visitor's real IP in `X-Forwarded-For` (resolved from
  // Cloudflare's `CF-Connecting-IP`). Trusting only loopback/private hops
  // means `req.ip` is that visitor, while a caller reaching this app from a
  // public address (if it were ever exposed) can't spoof the header: its own
  // socket address is used instead. The per-IP rate limiter
  // (`@enem-landing/backend-rate-limit`) and tracking both key on `req.ip`.
  app.set('trust proxy', 'loopback, uniquelocal');

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
