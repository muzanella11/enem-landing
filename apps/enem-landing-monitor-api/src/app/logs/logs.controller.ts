import { RateLimit } from '@enem-landing/backend-rate-limit';
import { RedisService } from '@enem-landing/backend-redis';
import { successResponse } from '@enem-landing/backend-utils';
import type {
  ContainerList,
  TimelinePage,
  User,
  ContainerLogLine,
  JournalPage,
  LogPage,
  LogsSummary,
  LogSourceInfo,
} from '@enem-landing/shared-types';
import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Readable } from 'node:stream';
import { LogReaderClient } from './log-reader.client.js';
import {
  CONTAINER_ID,
  ContainerPageQuery,
  FollowQuery,
  JournalQuery,
  PageQuery,
  SeekQuery,
  SlowlogQuery,
  SOURCE_ID,
  TimelineQuery,
  toQuery,
} from './logs.query.js';

/** Live tails open at once per SuperAdmin. */
export const MAX_STREAMS_PER_USER = 3;
const openStreams = new Map<string, number>();
import { parseSlowlog } from './redis-slowlog.js';

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/**
 * Read-only proxy to enem-landing-log-reader. SuperAdmin-only through the
 * global guard; every call is written to the audit log by AuditInterceptor.
 */
@RateLimit('admin')
@Controller('logs')
export class LogsController {
  private readonly logger = new Logger('Audit');

  constructor(
    private readonly reader: LogReaderClient,
    private readonly redisService: RedisService,
  ) {}

  @Get('summary')
  async summary() {
    return ok(await this.reader.get<LogsSummary>('/summary'));
  }

  @Get('sources')
  async sources() {
    return ok(await this.reader.get<LogSourceInfo[]>('/sources'));
  }

  @Get('sources/:id/entries')
  async sourceEntries(@Param('id') id: string, @Query() query: PageQuery) {
    if (!SOURCE_ID.test(id)) throw new BadRequestException('Invalid source id');
    return ok(
      await this.reader.get<LogPage<unknown>>(
        `/sources/${id}/entries`,
        toQuery(query),
      ),
    );
  }

  @Get('journal')
  async journal(@Query() query: JournalQuery) {
    return ok(await this.reader.get<JournalPage>('/journal', toQuery(query)));
  }

  @Get('journal/units')
  async journalUnits() {
    return ok(await this.reader.get<string[]>('/journal/units'));
  }

  @Get('containers')
  async containers() {
    return ok(await this.reader.get<ContainerList>('/containers'));
  }

  @Get('containers/:id/entries')
  async containerEntries(
    @Param('id') id: string,
    @Query() query: ContainerPageQuery,
  ) {
    if (!CONTAINER_ID.test(id))
      throw new BadRequestException('Invalid container id');
    return ok(
      await this.reader.get<LogPage<ContainerLogLine>>(
        `/containers/${id}/entries`,
        toQuery(query),
      ),
    );
  }

  /** Redis keeps its slow log in memory, so it is read here, not by the log-reader. */
  @Get('redis/slowlog')
  async redisSlowlog(@Query() query: SlowlogQuery) {
    try {
      return ok(
        parseSlowlog(await this.redisService.getSlowlog(query.limit ?? 50)),
      );
    } catch {
      throw new ServiceUnavailableException('Redis is unreachable');
    }
  }

  @Get('timeline')
  async timeline(@Query() query: TimelineQuery) {
    return ok(await this.reader.get<TimelinePage>('/timeline', toQuery(query)));
  }

  @Get('sources/:id/seek')
  async sourceSeek(@Param('id') id: string, @Query() query: SeekQuery) {
    if (!SOURCE_ID.test(id)) throw new BadRequestException('Invalid source id');
    return ok(await this.reader.get(`/sources/${id}/seek`, toQuery(query)));
  }

  @Get('containers/:id/seek')
  async containerSeek(@Param('id') id: string, @Query() query: SeekQuery) {
    if (!CONTAINER_ID.test(id))
      throw new BadRequestException('Invalid container id');
    return ok(await this.reader.get(`/containers/${id}/seek`, toQuery(query)));
  }

  @Get('sources/:id/follow')
  async followSource(
    @Param('id') id: string,
    @Query() query: FollowQuery,
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    if (!SOURCE_ID.test(id)) throw new BadRequestException('Invalid source id');
    await this.follow(`/sources/${id}/follow`, query, req, res);
  }

  @Get('containers/:id/follow')
  async followContainer(
    @Param('id') id: string,
    @Query() query: FollowQuery,
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ) {
    if (!CONTAINER_ID.test(id))
      throw new BadRequestException('Invalid container id');
    await this.follow(`/containers/${id}/follow`, query, req, res);
  }

  /**
   * Pipes the reader's SSE stream through. At most 3 per user (counted in
   * this process; the monitor-api runs one replica), and the start and
   * end of every session go to the audit log.
   */
  private async follow(
    path: string,
    query: FollowQuery,
    req: Request & { user: User },
    res: Response,
  ): Promise<void> {
    const user = req.user.email;
    const open = openStreams.get(user) ?? 0;
    if (open >= MAX_STREAMS_PER_USER) {
      throw new HttpException(
        `At most ${MAX_STREAMS_PER_USER} live tails per user`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const controller = new AbortController();
    const upstream = await this.reader.stream(
      path,
      toQuery(query),
      controller.signal,
    );
    openStreams.set(user, open + 1);
    const started = Date.now();
    this.logger.log(`user=${user} follow start ${path}`);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      controller.abort();
      const left = (openStreams.get(user) ?? 1) - 1;
      if (left > 0) openStreams.set(user, left);
      else openStreams.delete(user);
      this.logger.log(
        `user=${user} follow end ${path} seconds=${Math.round((Date.now() - started) / 1000)}`,
      );
      res.end();
    };
    req.on('close', end);
    const body = Readable.fromWeb(
      upstream.body as unknown as import('node:stream/web').ReadableStream,
    );
    body.on('error', end);
    body.on('end', end);
    body.pipe(res, { end: false });
  }
}
