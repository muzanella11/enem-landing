import 'reflect-metadata';
import './load-env.js';
import { AllExceptionsFilter } from '@enem-landing/backend-utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env['PORT'] || 3000;
  const corsOrigin = process.env['CORS_ORIGIN'];

  // Internal-only like enem-landing-api: BFF routes forward the visitor's
  // IP in `X-Forwarded-For`. Only trust it from loopback/private hops so
  // `req.ip` (the rate limiter's key) can't be spoofed from a public
  // address.
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
  Logger.log(
    `🚀 enem-landing-account-api is running on: http://localhost:${port}`,
  );
}

bootstrap();
