import 'reflect-metadata';
import './load-env.js';
import { AllExceptionsFilter } from '@enem-landing/backend-utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env['PORT'] || 3003;

  // Internal-only (traefik.enable=false, no published port): only the
  // monitor's BFF calls this app over the overlay network and forwards the
  // visitor's IP in X-Forwarded-For. Trusting only private hops keeps
  // `req.ip` (the rate limiter's key) unspoofable.
  app.set('trust proxy', 'loopback, uniquelocal');
  app.disable('x-powered-by');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  // No CORS: browsers never call this app directly.

  await app.listen(port);
  Logger.log(
    `🚀 enem-landing-monitor-api is running on: http://localhost:${port}`,
  );
}

bootstrap();
