import { RateLimit } from '@enem-landing/backend-rate-limit';
import { RedisService } from '@enem-landing/backend-redis';
import { successResponse } from '@enem-landing/backend-utils';
import type {
  ContainerList,
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
  HttpStatus,
  Param,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { LogReaderClient } from './log-reader.client.js';
import {
  CONTAINER_ID,
  ContainerPageQuery,
  JournalQuery,
  PageQuery,
  SlowlogQuery,
  SOURCE_ID,
  toQuery,
} from './logs.query.js';
import { parseSlowlog } from './redis-slowlog.js';

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/**
 * Read-only proxy to enem-landing-log-reader. SuperAdmin-only through the
 * global guard; every call is written to the audit log by AuditInterceptor.
 */
@RateLimit('admin')
@Controller('logs')
export class LogsController {
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
}
