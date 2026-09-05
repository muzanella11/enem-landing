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

  // Trust exactly one hop - this app's own Traefik reverse proxy - so
  // `req.ip` resolves to the real visitor IP instead of Traefik's address.
  // Affects both the new tracking module and contact-submissions' existing
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
