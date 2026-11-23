import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MetricsService } from './metrics.service.js';

class HistoryQuery {
  /** Comma separated series names, see SERIES_NAME. */
  @IsString() @MaxLength(2000) series!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48) hours?: number;
}

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

@RateLimit('admin')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('host')
  async host() {
    return ok(await this.metrics.host());
  }

  @Get('containers')
  async containers() {
    return ok(await this.metrics.containers());
  }

  @Get('history')
  async history(@Query() query: HistoryQuery) {
    return ok(
      await this.metrics.history(
        query.series.split(',').slice(0, 40),
        query.hours ?? 24,
      ),
    );
  }
}
