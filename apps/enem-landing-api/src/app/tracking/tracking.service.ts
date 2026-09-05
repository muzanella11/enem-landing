import type { TrackingOverview } from '@enem-landing/shared-types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';
import { Repository } from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { CreatePageviewItemDto } from './dto/create-pageview-batch.dto.js';
import { CreateEventItemDto } from './dto/create-event-batch.dto.js';
import { CreateClickItemDto } from './dto/create-click-batch.dto.js';
import { TrackingClickEntity } from './tracking-click.entity.js';
import { TrackingEventEntity } from './tracking-event.entity.js';
import { TrackingPageviewEntity } from './tracking-pageview.entity.js';
import { TrackingRecordingService } from './tracking-recording.service.js';
import { TrackingSessionEntity } from './tracking-session.entity.js';
import { TrackingSettingsService } from './tracking-settings.service.js';

const ACTIVE_SESSION_WINDOW_MS = 30 * 60 * 1000;

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(TrackingSessionEntity)
    private readonly sessionRepository: Repository<TrackingSessionEntity>,
    @InjectRepository(TrackingPageviewEntity)
    private readonly pageviewRepository: Repository<TrackingPageviewEntity>,
    @InjectRepository(TrackingEventEntity)
    private readonly eventRepository: Repository<TrackingEventEntity>,
    @InjectRepository(TrackingClickEntity)
    private readonly clickRepository: Repository<TrackingClickEntity>,
    private readonly trackingSettingsService: TrackingSettingsService,
    private readonly trackingRecordingService: TrackingRecordingService,
  ) {}

  async createSession(
    dto: CreateSessionDto,
    ip: string,
    userAgent: string | undefined,
    acceptLanguage: string | undefined,
  ): Promise<TrackingSessionEntity> {
    const { browser, os, device, engine, cpu } = new UAParser(
      userAgent ?? '',
    ).getResult();
    const geo = geoip.lookup(ip);
    const settings = await this.trackingSettingsService.getOrCreate();
    const recordingSampled =
      settings.sessionRecordingEnabled &&
      Math.random() * 100 < settings.sessionRecordingSampleRatePct;

    const session = this.sessionRepository.create({
      visitorId: dto.visitorId,
      recordingSampled,
      startedAt: new Date(),
      endedAt: null,
      referrer: dto.referrer ?? null,
      utmSource: dto.utmSource ?? null,
      utmMedium: dto.utmMedium ?? null,
      utmCampaign: dto.utmCampaign ?? null,
      deviceType: device.type ?? 'desktop',
      deviceVendor: device.vendor ?? null,
      deviceModel: device.model ?? null,
      browserName: browser.name ?? null,
      browserVersion: browser.version ?? null,
      engineName: engine.name ?? null,
      engineVersion: engine.version ?? null,
      osName: os.name ?? null,
      osVersion: os.version ?? null,
      cpuArchitecture: cpu.architecture ?? null,
      language: dto.language ?? this.parsePrimaryLanguage(acceptLanguage),
      timezone: dto.timezone ?? null,
      screenWidth: dto.screenWidth ?? null,
      screenHeight: dto.screenHeight ?? null,
      ipAddress: ip,
      country: geo?.country ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
      latitude: geo?.ll?.[0] ?? null,
      longitude: geo?.ll?.[1] ?? null,
    });

    return this.sessionRepository.save(session);
  }

  /** Fallback when the browser doesn't send `navigator.language` itself - takes the first, highest-priority tag from `Accept-Language` (e.g. "en-US,en;q=0.9" -> "en-US"). */
  private parsePrimaryLanguage(
    acceptLanguage: string | undefined,
  ): string | null {
    if (!acceptLanguage) return null;
    return acceptLanguage.split(',')[0]?.split(';')[0]?.trim() || null;
  }

  async recordPageviews(
    items: CreatePageviewItemDto[],
  ): Promise<TrackingPageviewEntity[]> {
    const rows = items.map((item) =>
      this.pageviewRepository.create({
        sessionId: item.sessionId,
        path: item.path,
        enteredAt: new Date(item.enteredAt),
        durationMs: null,
      }),
    );
    return this.pageviewRepository.save(rows);
  }

  async recordPageviewDuration(id: string, durationMs: number): Promise<void> {
    const pageview = await this.pageviewRepository.findOne({ where: { id } });
    if (!pageview) {
      throw new NotFoundException('Pageview not found');
    }
    await this.pageviewRepository.update(id, { durationMs });
  }

  /**
   * No-ops (returns an empty array, writes nothing) when `eventsEnabled`
   * is off - defense in depth, doesn't just trust the client to have
   * respected the toggle before sending.
   */
  async recordEvents(
    items: CreateEventItemDto[],
  ): Promise<TrackingEventEntity[]> {
    const settings = await this.trackingSettingsService.getOrCreate();
    if (!settings.eventsEnabled) return [];

    const rows = items.map((item) =>
      this.eventRepository.create({
        sessionId: item.sessionId,
        name: item.name,
        payload: item.payload ?? null,
        path: item.path ?? null,
        occurredAt: new Date(item.occurredAt),
      }),
    );
    return this.eventRepository.save(rows);
  }

  /** No-ops when `heatmapEnabled` is off - same defense-in-depth as `recordEvents`. */
  async recordClicks(
    items: CreateClickItemDto[],
  ): Promise<TrackingClickEntity[]> {
    const settings = await this.trackingSettingsService.getOrCreate();
    if (!settings.heatmapEnabled) return [];

    const rows = items.map((item) =>
      this.clickRepository.create({
        path: item.path,
        xPct: item.xPct,
        yPct: item.yPct,
        deviceBucket: item.deviceBucket,
        occurredAt: new Date(item.occurredAt),
      }),
    );
    return this.clickRepository.save(rows);
  }

  /**
   * No-ops when `sessionRecordingEnabled` is off, the session isn't
   * found, or the session's own `recordingSampled` roll (decided once at
   * `createSession`) came up false - a client that ignores its own
   * sampling decision (or the toggle changing mid-session) still can't
   * force a chunk to actually upload.
   */
  async recordSessionChunk(
    sessionId: string,
    sequence: number,
    events: unknown[],
  ) {
    const settings = await this.trackingSettingsService.getOrCreate();
    if (!settings.sessionRecordingEnabled) return null;

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session || !session.recordingSampled) return null;

    return this.trackingRecordingService.uploadChunk(
      sessionId,
      sequence,
      events,
    );
  }

  async getOverview(): Promise<TrackingOverview> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const activeSince = new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS);

    const [
      pageviewsToday,
      activeSessions,
      totalVisitors,
      pageviewsByDayRaw,
      topPathsRaw,
      topReferrersRaw,
      devicesRaw,
      locationsRaw,
    ] = await Promise.all([
      this.pageviewRepository
        .createQueryBuilder('pageview')
        .where('pageview.enteredAt >= :todayStart', { todayStart })
        .getCount(),
      this.sessionRepository
        .createQueryBuilder('session')
        .where('session.startedAt >= :activeSince', { activeSince })
        .getCount(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('COUNT(DISTINCT session.visitorId)', 'count')
        .getRawOne<{ count: string }>(),
      this.pageviewRepository
        .createQueryBuilder('pageview')
        .select('DATE(pageview.enteredAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; count: string }>(),
      this.pageviewRepository
        .createQueryBuilder('pageview')
        .select('pageview.path', 'path')
        .addSelect('COUNT(*)', 'count')
        .groupBy('pageview.path')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ path: string; count: string }>(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('session.referrer', 'referrer')
        .addSelect('COUNT(*)', 'count')
        .where('session.referrer IS NOT NULL')
        .groupBy('session.referrer')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ referrer: string; count: string }>(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('session.deviceType', 'device')
        .addSelect('COUNT(*)', 'count')
        .groupBy('session.deviceType')
        .orderBy('count', 'DESC')
        .getRawMany<{ device: string; count: string }>(),
      this.sessionRepository
        .createQueryBuilder('session')
        .select('session.country', 'country')
        .addSelect('session.city', 'city')
        .addSelect('session.latitude', 'latitude')
        .addSelect('session.longitude', 'longitude')
        .addSelect('COUNT(*)', 'count')
        .where('session.latitude IS NOT NULL')
        .andWhere('session.longitude IS NOT NULL')
        .groupBy('session.country')
        .addGroupBy('session.city')
        .addGroupBy('session.latitude')
        .addGroupBy('session.longitude')
        .orderBy('count', 'DESC')
        .getRawMany<{
          country: string | null;
          city: string | null;
          latitude: string;
          longitude: string;
          count: string;
        }>(),
    ]);

    const topCountryRaw = await this.sessionRepository
      .createQueryBuilder('session')
      .select('session.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('session.country IS NOT NULL')
      .groupBy('session.country')
      .orderBy('count', 'DESC')
      .limit(1)
      .getRawOne<{ country: string; count: string }>();

    return {
      pageviewsToday,
      activeSessions,
      totalVisitors: Number(totalVisitors?.count ?? 0),
      topCountry: topCountryRaw?.country ?? null,
      pageviewsByDay: pageviewsByDayRaw.map((row) => ({
        // mysql2 returns MySQL's DATE() result as a JS Date, which
        // serializes to a full ISO timestamp over JSON - trim it back to
        // the plain YYYY-MM-DD the query actually grouped by.
        date: new Date(row.date).toISOString().slice(0, 10),
        count: Number(row.count),
      })),
      topPaths: topPathsRaw.map((row) => ({
        path: row.path,
        count: Number(row.count),
      })),
      topReferrers: topReferrersRaw.map((row) => ({
        referrer: row.referrer,
        count: Number(row.count),
      })),
      devices: devicesRaw.map((row) => ({
        device: row.device,
        count: Number(row.count),
      })),
      locations: locationsRaw.map((row) => ({
        country: row.country,
        city: row.city,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        count: Number(row.count),
      })),
    };
  }
}
