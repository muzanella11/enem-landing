import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  logReaderHost,
  logReaderToken,
  logsEnabled,
} from '../monitor.config.js';

const TIMEOUT_MS = 15_000;

/**
 * Talks to enem-landing-log-reader over the overlay network with this
 * environment's own `LOG_READER_TOKEN`. Only allowlisted query keys are
 * forwarded; the reader validates every value again.
 */
@Injectable()
export class LogReaderClient {
  private readonly logger = new Logger(LogReaderClient.name);

  /**
   * Opens a live tail (SSE) on the reader and returns the raw response, so
   * the caller can pipe its body. No timeout: the reader ends it itself
   * after 15 minutes, and `signal` aborts it when the browser leaves.
   */
  async stream(
    path: string,
    query: Record<string, string | undefined>,
    signal: AbortSignal,
  ): Promise<Response> {
    if (!logsEnabled()) {
      throw new ServiceUnavailableException(
        'Logs are disabled in this environment',
      );
    }
    const url = new URL(path, logReaderHost());
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'X-Log-Reader-Token': logReaderToken() },
        signal,
      });
    } catch (error) {
      this.logger.warn(`log-reader unreachable: ${String(error)}`);
      throw new HttpException(
        'Log reader is unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new HttpException(
        body.message ?? 'Log reader request failed',
        response.status === 401 ? HttpStatus.BAD_GATEWAY : response.status,
      );
    }
    return response;
  }

  async get<T>(
    path: string,
    query: Record<string, string | undefined> = {},
  ): Promise<T> {
    if (!logsEnabled()) {
      throw new ServiceUnavailableException(
        'Logs are disabled in this environment',
      );
    }
    const url = new URL(path, logReaderHost());
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { 'X-Log-Reader-Token': logReaderToken() },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`log-reader unreachable: ${String(error)}`);
      throw new HttpException(
        'Log reader is unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (!response.ok) {
      // A 401 from the reader means a token mismatch between the two
      // services, not a problem with the signed-in user's session.
      const status =
        response.status === 401 ? HttpStatus.BAD_GATEWAY : response.status;
      throw new HttpException(
        body.message ?? 'Log reader request failed',
        status,
      );
    }
    return body as T;
  }
}
