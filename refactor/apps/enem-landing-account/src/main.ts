import 'reflect-metadata';
import './load-env.js';
import { AllExceptionsFilter } from '@enem-landing/backend-utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env['PORT'] || 3000;
  const corsOrigin = process.env['CORS_ORIGIN'];

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
  Logger.log(`🚀 enem-landing-account is running on: http://localhost:${port}`);
}

bootstrap();
