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

  @Get('config')
  async getConfig() {
    const settings = await this.trackingSettingsService.getOrCreate();
    return {
      pageviewEnabled: settings.pageviewEnabled,
      eventsEnabled: settings.eventsEnabled,
      heatmapEnabled: settings.heatmapEnabled,
      sessionRecordingEnabled: settings.sessionRecordingEnabled,
      sessionRecordingSampleRatePct: settings.sessionRecordingSampleRatePct,
    };
  }

  @Post('session')
  createSession(@Req() req: Request, @Body() dto: CreateSessionDto) {
    return this.trackingService.createSession(
      dto,
      req.ip ?? 'unknown',
      req.headers['user-agent'],
      req.headers['accept-language'],
    );
  }

  @Post('pageview')
  recordPageviews(@Body() dto: CreatePageviewBatchDto) {
    return this.trackingService.recordPageviews(dto.items);
  }

  @Post('pageview/:id/duration')
  recordPageviewDuration(
    @Param('id') id: string,
    @Body() dto: RecordPageviewDurationDto,
  ) {
    return this.trackingService.recordPageviewDuration(id, dto.durationMs);
  }

  @UseGuards(SsoAuthGuard)
  @Get('settings')
  getSettings(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingSettingsService.getOrCreate();
  }

  @UseGuards(SsoAuthGuard)
  @Put('settings')
  updateSettings(@Req() req: Request, @Body() dto: UpdateTrackingSettingsDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingSettingsService.update(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Get('overview')
  getOverview(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingService.getOverview();
  }

  @Post('events')
  recordEvents(@Body() dto: CreateEventBatchDto) {
    return this.trackingService.recordEvents(dto.items);
  }

  @UseGuards(SsoAuthGuard)
  @Get('funnels')
  findAllFunnels(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingFunnelsService.findAll();
  }

  @UseGuards(SsoAuthGuard)
  @Post('funnels')
  createFunnel(@Req() req: Request, @Body() dto: CreateFunnelDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingFunnelsService.create(dto);
  }

  @UseGuards(SsoAuthGuard)
  @Put('funnels/:id')
  updateFunnel(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateFunnelDto,
  ) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingFunnelsService.update(id, dto);
  }

  @UseGuards(SsoAuthGuard)
  @Delete('funnels/:id')
  removeFunnel(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingFunnelsService.remove(id);
  }

  @UseGuards(SsoAuthGuard)
  @Get('funnels/:id/report')
  getFunnelReport(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingFunnelsService.getReport(id);
  }

  @Post('clicks')
  recordClicks(@Body() dto: CreateClickBatchDto) {
    return this.trackingService.recordClicks(dto.items);
  }

  @UseGuards(SsoAuthGuard)
  @Get('heatmap/paths')
  getHeatmapPaths(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingHeatmapService.getDistinctPaths();
  }

  @UseGuards(SsoAuthGuard)
  @Get('heatmap')
  getHeatmap(@Req() req: Request, @Query() query: GetHeatmapQueryDto) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingHeatmapService.getHeatmap(query.path, query.device);
  }

  @UseGuards(SsoAuthGuard)
  @Post('heatmap/aggregate')
  triggerHeatmapAggregation(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingHeatmapService.triggerNow();
  }

  @Post('session-recording')
  recordSessionChunk(@Body() dto: RecordSessionChunkDto) {
    return this.trackingService.recordSessionChunk(
      dto.sessionId,
      dto.sequence,
      dto.events,
    );
  }

  @UseGuards(SsoAuthGuard)
  @Get('sessions')
  getSessionsWithRecording(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingRecordingService.getSessionsWithRecording();
  }

  @UseGuards(SsoAuthGuard)
  @Get('sessions/:id/recording')
  getSessionRecording(@Req() req: Request, @Param('id') id: string) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingRecordingService.getRecordingChunks(id);
  }

  @UseGuards(SsoAuthGuard)
  @Post('recordings/prune')
  triggerRecordingPrune(@Req() req: Request) {
    assertAdminRole((req as Request & { user: User }).user);
    return this.trackingRecordingService.triggerPruneNow();
  }
}
