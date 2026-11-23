import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { AlertService } from './alert.service.js';

class HistoryQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number;
}

class RuleUpdateBody {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsNumber() threshold?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10_080) cooldownMinutes?: number;
}

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/** Alert history and rule settings. Email settings live in CMS Settings, not here. */
@RateLimit('admin')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertService) {}

  @Get()
  async history(@Query() query: HistoryQuery) {
    return ok(await this.alerts.history(query.limit ?? 500));
  }

  @Get('overview')
  async overview() {
    return ok(await this.alerts.overview());
  }

  @Get('rules')
  async rules() {
    return ok(await this.alerts.publicRules());
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() body: RuleUpdateBody) {
    return ok(await this.alerts.updateRule(id, body));
  }
}
