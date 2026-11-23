import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { isAuthorized } from './auth.js';
import type { ReaderConfig } from './config.js';
import { HttpError } from './errors.js';
import { Handlers } from './handlers.js';
import { REQUEST_TIMEOUT_MS } from './limits.js';

export const TOKEN_HEADER = 'x-log-reader-token';

type Route = {
  pattern: RegExp;
  handle: (
    match: RegExpExecArray,
    params: URLSearchParams,
    deadline: number,
  ) => Promise<unknown>;
};

const send = (res: ServerResponse, status: number, body: unknown) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
};

export const buildRoutes = (handlers: Handlers): Route[] => [
  { pattern: /^\/sources$/, handle: () => handlers.sources() },
  {
    // Ids are matched against the allowlist in the handler; this pattern
    // only keeps obviously bogus input (slashes, dots) out.
    pattern: /^\/sources\/([a-z0-9-]{1,40})\/entries$/,
    handle: (match, params, deadline) =>
      handlers.sourceEntries(match[1], params, deadline),
  },
  {
    pattern: /^\/journal$/,
    handle: (_match, params, deadline) => handlers.journal(params, deadline),
  },
  {
    pattern: /^\/journal\/units$/,
    handle: (_match, _params, deadline) => handlers.journalUnits(deadline),
  },
  { pattern: /^\/containers$/, handle: () => handlers.containers() },
  {
    pattern: /^\/containers\/([a-f0-9]{64})\/entries$/,
    handle: (match, params, deadline) =>
      handlers.containerEntries(match[1], params, deadline),
  },
  {
    pattern: /^\/summary$/,
    handle: (_match, _params, deadline) => handlers.summary(deadline),
  },
  // metrics
  { pattern: /^\/metrics\/host$/, handle: () => handlers.hostMetrics() },
  {
    pattern: /^\/metrics\/containers$/,
    handle: () => handlers.containerMetrics(),
  },
  // backup runs from the journal
  {
    pattern: /^\/backup\/status$/,
    handle: (_match, _params, deadline) => handlers.backupStatus(deadline),
  },
  // login analysis
  {
    pattern: /^\/security\/summary$/,
    handle: (_match, params, deadline) =>
      handlers.securitySummary(params, deadline),
  },
  {
    pattern: /^\/security\/logins$/,
    handle: (_match, params, deadline) =>
      handlers.securityLogins(params, deadline),
  },
  {
    pattern: /^\/security\/failed-count$/,
    handle: (_match, params, deadline) =>
      handlers.failedCount(params, deadline),
  },
  // MySQL file sizes and slow query patterns
  { pattern: /^\/mysql\/sizes$/, handle: () => handlers.mysqlSizes() },
  {
    pattern: /^\/mysql\/slow-patterns$/,
    handle: (_match, _params, deadline) => handlers.mysqlSlowPatterns(deadline),
  },
  // timeline and jump to time
  {
    pattern: /^\/timeline$/,
    handle: (_match, params, deadline) => handlers.timeline(params, deadline),
  },
  {
    pattern: /^\/sources\/([a-z0-9-]{1,40})\/seek$/,
    handle: (match, params) => handlers.sourceSeek(match[1], params),
  },
  {
    pattern: /^\/containers\/([a-f0-9]{64})\/seek$/,
    handle: (match, params) => handlers.containerSeek(match[1], params),
  },
];

type StreamRoute = {
  pattern: RegExp;
  handle: (
    match: RegExpExecArray,
    params: URLSearchParams,
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void>;
};

/** Live tails (Server-Sent Events): the handler owns the response. */
export const buildStreamRoutes = (handlers: Handlers): StreamRoute[] => [
  {
    pattern: /^\/sources\/([a-z0-9-]{1,40})\/follow$/,
    handle: (match, params, req, res) =>
      handlers.followSource(match[1], params, req, res),
  },
  {
    pattern: /^\/containers\/([a-f0-9]{64})\/follow$/,
    handle: (match, params, req, res) =>
      handlers.followContainer(match[1], params, req, res),
  },
];

/**
 * Plain `node:http`, read-only API. Only `GET`, only allowlisted routes,
 * and every route except `/health` needs a valid `X-Log-Reader-Token`.
 */
export const createReaderServer = (
  config: ReaderConfig,
  handlers = new Handlers(config),
): Server => {
  const routes = buildRoutes(handlers);
  const streamRoutes = buildStreamRoutes(handlers);

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const url = new URL(req.url ?? '/', 'http://log-reader');
      // HEAD only for the healthcheck (wait-on, container probes).
      const isHealth = url.pathname === '/health';
      if (req.method !== 'GET' && !(isHealth && req.method === 'HEAD')) {
        throw new HttpError(405, 'Method not allowed');
      }

      if (isHealth) {
        send(res, 200, { status: 'ok' });
        return;
      }
      if (!isAuthorized(req.headers[TOKEN_HEADER], config.tokens)) {
        throw new HttpError(401, 'Invalid or missing token');
      }

      for (const route of streamRoutes) {
        const match = route.pattern.exec(url.pathname);
        if (match) {
          await route.handle(match, url.searchParams, req, res);
          return;
        }
      }
      for (const route of routes) {
        const match = route.pattern.exec(url.pathname);
        if (match) {
          const deadline = Date.now() + REQUEST_TIMEOUT_MS;
          send(res, 200, await route.handle(match, url.searchParams, deadline));
          return;
        }
      }
      throw new HttpError(404, 'Not found');
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (error instanceof HttpError) {
        send(res, error.status, { message: error.message });
        return;
      }
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        send(res, 404, { message: 'Log file not found' });
        return;
      }
      if (code === 'EACCES' || code === 'EPERM') {
        send(res, 403, {
          message: 'The reader has no permission to read this file',
        });
        return;
      }
      console.error('[log-reader] request failed', error);
      send(res, 500, { message: 'Failed to read the log' });
    }
  });
};
