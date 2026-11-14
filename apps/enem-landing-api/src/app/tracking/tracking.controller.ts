import { RateLimit } from '@enem-landing/backend-rate-limit';
import { successResponse } from '@enem-landing/backend-utils';
import { SsoAuthGuard } from '@enem-landing/backend-sso';
import type { User } from '@enem-landing/shared-types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { assertAdminRole } from '../common/assert-admin-role.js';
import { CreateClickBatchDto } from './dto/create-click-batch.dto.js';
import { CreateEventBatchDto } from './dto/create-event-batch.dto.js';
import { CreateFunnelDto } from './dto/create-funnel.dto.js';
import { CreatePageviewBatchDto } from './dto/create-pageview-batch.dto.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { GetHeatmapQueryDto } from './dto/get-heatmap-query.dto.js';
import { RecordPageviewDurationDto } from './dto/record-pageview-duration.dto.js';
import { RecordSessionChunkDto } from './dto/record-session-chunk.dto.js';
import { SiteQueryDto } from './dto/site-query.dto.js';
import { UpdateFunnelDto } from './dto/update-funnel.dto.js';
import { UpdateTrackingSettingsDto } from './dto/update-tracking-settings.dto.js';
import { TrackingService } from './tracking.service.js';
import { TrackingFunnelsService } from './tracking-funnels.service.js';
import { TrackingHeatmapService } from './tracking-heatmap.service.js';
import { TrackingRecordingService } from './tracking-recording.service.js';
import { TrackingSettingsService } from './tracking-settings.service.js';

@Controller('tracking')
export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly trackingSettingsService: TrackingSettingsService,
    private readonly trackingFunnelsService: TrackingFunnelsService,
    private readonly trackingHeatmapService: TrackingHeatmapService,
    private readonly trackingRecordingService: TrackingRecordingService,
  ) {}

  @RateLimit('tracking')
  @Get('config')
  async getConfig(@Query() query: SiteQueryDto) {
    const settings = await this.trackingSettingsService.getOrCreate(query.site);
    return successResponse(HttpStatus.OK, 'Success', {
      pageviewEnabled: settings.pageviewEnabled,
      eventsEnabled: settings.eventsEnabled,
      heatmapEnabled: settings.heatmapEnabled,
      sessionRecordingEnabled: settings.sessionRecordingEnabled,
      sessionRecordingSampleRatePct: settings.sessionRecordingSampleRatePct,
    });
  }

  @RateLimit('tracking')
  @Post('session')
  async createSession(@Req() req: Request, @Body() dto: CreateSessionDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.createSession(
        dto,
        req.ip ?? 'unknown',
        req.headers['user-agent'],
        req.headers['accept-language'],
      ),
    );
  }

  @RateLimit('tracking')
  @Post('pageview')
  async recordPageviews(@Body() dto: CreatePageviewBatchDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.recordPageviews(dto.items),
    );
  }

  @RateLimit('tracking')
  @Post('pageview/:id/duration')
  async recordPageviewDuration(
    @Param('id') id: string,
    @Body() dto: RecordPageviewDurationDto,
  ) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.recordPageviewDuration(id, dto.durationMs),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('settings')
  async getSettings(@Req() req: Request, @Query() query: SiteQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingSettingsService.getOrCreate(query.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('settings')
  async updateSettings(
    @Req() req: Request,
    @Query() query: SiteQueryDto,
    @Body() dto: UpdateTrackingSettingsDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingSettingsService.update(dto, query.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('overview')
  async getOverview(@Req() req: Request, @Query() query: SiteQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingService.getOverview(query.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('visitors')
  async getVisitors(@Req() req: Request, @Query() query: SiteQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingService.getVisitors(query.site),
    );
  }

  @RateLimit('tracking')
  @Post('events')
  async recordEvents(@Body() dto: CreateEventBatchDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.recordEvents(dto.items),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('funnels')
  async findAllFunnels(@Req() req: Request, @Query() query: SiteQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingFunnelsService.findAll(query.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post('funnels')
  async createFunnel(@Req() req: Request, @Body() dto: CreateFunnelDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingFunnelsService.create(dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Put('funnels/:id')
  async updateFunnel(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateFunnelDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingFunnelsService.update(id, dto),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Delete('funnels/:id')
  async removeFunnel(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingFunnelsService.remove(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('funnels/:id/report')
  async getFunnelReport(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingFunnelsService.getReport(id),
    );
  }

  @RateLimit('tracking')
  @Post('clicks')
  async recordClicks(@Body() dto: CreateClickBatchDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.recordClicks(dto.items, dto.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('heatmap/paths')
  async getHeatmapPaths(@Req() req: Request, @Query() query: SiteQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingHeatmapService.getDistinctPaths(query.site),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('heatmap')
  async getHeatmap(@Req() req: Request, @Query() query: GetHeatmapQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingHeatmapService.getHeatmap(
        query.path,
        query.device,
        query.site,
      ),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post('heatmap/aggregate')
  async triggerHeatmapAggregation(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingHeatmapService.triggerNow(),
    );
  }

  @RateLimit('tracking')
  @Post('session-recording')
  async recordSessionChunk(@Body() dto: RecordSessionChunkDto) {
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingService.recordSessionChunk(
        dto.sessionId,
        dto.sequence,
        dto.events,
      ),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('sessions')
  async getSessionsWithRecording(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingRecordingService.getSessionsWithRecording(),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('sessions/:id/recording')
  async getSessionRecording(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.OK,
      'Success',
      await this.trackingRecordingService.getRecordingChunks(id),
    );
  }

  @UseGuards(SsoAuthGuard)
  @Post('recordings/prune')
  async triggerRecordingPrune(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return successResponse(
      HttpStatus.CREATED,
      'Success',
      await this.trackingRecordingService.triggerPruneNow(),
    );
  }
}
