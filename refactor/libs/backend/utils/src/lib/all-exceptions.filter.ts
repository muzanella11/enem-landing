import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Ported from mau-apps
 * (`libs/backend/utils/src/lib/all-exceptions.filter.ts`) — uniform error
 * JSON shape across all NestJS apps, plus a friendlier message for Postgres
 * unique-constraint violations. Kept decoupled from `typeorm` types (duck-
 * types the driver error shape instead) so this lib has no hard dependency
 * on it.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error(
      `HTTP ${status} on ${request.method} ${request.url}: ${this.describe(exception)}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: this.toMessage(exception),
    });
  }

  private describe(exception: unknown): string {
    if (exception instanceof Error) return exception.message;
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }

  private toMessage(exception: unknown): string {
    const detail = this.extractDuplicateKeyDetail(exception);
    if (detail) return detail;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') return body;
      if (body && typeof body === 'object' && 'message' in body) {
        const { message } = body as { message: unknown };
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
    }

    return exception instanceof Error ? exception.message : 'Internal server error';
  }

  /** Turns a raw Postgres unique-violation error into a readable message. */
  private extractDuplicateKeyDetail(exception: unknown): string | null {
    const message = exception instanceof Error ? exception.message : '';
    if (!message.includes('duplicate key value violates unique constraint')) {
      return null;
    }

    const driverDetail = (
      exception as { driverError?: { detail?: string } }
    )?.driverError?.detail;
    const match = driverDetail?.match(/\(([^)]+)\)=\(([^)]+)\)/);

    if (!match) {
      return 'A duplicate key error occurred. Please ensure the uniqueness of your input data.';
    }

    const keys = match[1].split(',').map((key) => key.trim());
    const values = match[2].split(',').map((value) => value.trim());

    return `Duplicate key error: ${keys.map((key, index) => `${key}: ${values[index]}`).join(' ')} already exists.`;
  }
}
