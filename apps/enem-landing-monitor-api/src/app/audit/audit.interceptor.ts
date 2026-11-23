import type { User } from '@enem-landing/shared-types';
import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { type Observable, tap } from 'rxjs';

/**
 * Basic audit trail: who read what and when. Every request that got past
 * the guard is logged with the user, method, full URL (log source or
 * container id plus filters), status and duration. Ends up in this
 * container's own log, readable from the monitor's Apps menu.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: User }>();
    if (request.path === '/health') return next.handle();
    const started = Date.now();
    const write = (status: number) =>
      this.logger.log(
        `user=${request.user?.email ?? '-'} role=${request.user?.role ?? '-'} ${request.method} ${request.originalUrl} status=${status} ms=${Date.now() - started}`,
      );
    return next.handle().pipe(
      tap({
        next: () => write(http.getResponse<Response>().statusCode),
        error: (error: { status?: number; getStatus?: () => number }) =>
          write(error.getStatus?.() ?? error.status ?? 500),
      }),
    );
  }
}
