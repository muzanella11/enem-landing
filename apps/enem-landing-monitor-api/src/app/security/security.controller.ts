import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SecurityService } from './security.service.js';

class SummaryQuery {
  @IsOptional() @Type(() => Number) @IsIn([24, 168]) hours?: number;
}

class KnownIpBody {
  @IsString() @MaxLength(60) label!: string;
}

const ok = (data: unknown) => successResponse(HttpStatus.OK, 'Success', data);

/** Read-only analysis; nothing here blocks an IP (the UI only suggests `ufw deny`). */
@RateLimit('admin')
@Controller('security')
export class SecurityController {
  constructor(private readonly security: SecurityService) {}

  @Get('summary')
  async summary(@Query() query: SummaryQuery) {
    return ok(await this.security.summary(query.hours ?? 24));
  }

  @Get('known-ips')
  async knownIps() {
    return ok(await this.security.knownIps());
  }

  @Put('known-ips/:ip')
  async addKnownIp(@Param('ip') ip: string, @Body() body: KnownIpBody) {
    await this.security.addKnownIp(ip, body.label);
    return ok(await this.security.knownIps());
  }

  @Delete('known-ips/:ip')
  async removeKnownIp(@Param('ip') ip: string) {
    await this.security.removeKnownIp(ip);
    return ok(await this.security.knownIps());
  }
}
