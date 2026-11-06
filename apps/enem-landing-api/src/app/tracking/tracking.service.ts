import type { TrackingOverview } from '@enem-landing/shared-types';
import {
  isRecordingAllowedForSite,
  sanitizeToolsEventPayload,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UAParser } from 'ua-parser-js';
import { In, Repository } from 'typeorm';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { CreatePageviewItemDto } from './dto/create-pageview-batch.dto.js';
import { CreateEventItemDto } from './dto/create-event-batch.dto.js';
import { CreateClickItemDto } from './dto/create-click-batch.dto.js';
import { lookupGeo } from './geo-lookup.js';
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
    const geo = await lookupGeo(ip);
    const site = dto.site ?? 'landing';
    const settings = await this.trackingSettingsService.getOrCreate(site);
    const recordingSampled =
      isRecordingAllowedForSite(site) &&
      settings.sessionRecordingEnabled &&
      Math.random() * 100 < settings.sessionRecordingSampleRatePct;

    const session = this.sessionRepository.create({
      site,
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
      country: geo.country,
      region: geo.region,
      city: geo.city,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      org: geo.org,
      asn: geo.asn,
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
   * Drops events whose site has `eventsEnabled` off - defense in depth,
   * doesn't just trust the client to have respected the toggle. Each
   * event's site comes from its session (an unknown session counts as
   * `landing`, matching single-site behavior). Payloads from the tools
   * site are reduced to whitelisted short string keys (Story 25), so a
   * user's salary or invoice value can never be stored here.
   */
  async recordEvents(
    items: CreateEventItemDto[],
  ): Promise<TrackingEventEntity[]> {
    if (items.length === 0) return [];
    const siteBySession = await this.resolveSessionSites(
      items.map((item) => item.sessionId),
    );
    const enabledBySite = new Map<TrackingSite, boolean>();
    const isEnabled = async (site: TrackingSite) => {
      if (!enabledBySite.has(site)) {
        const settings = await this.trackingSettingsService.getOrCreate(site);
        enabledBySite.set(site, settings.eventsEnabled);
      }
      return enabledBySite.get(site) ?? false;
    };

    const rows: TrackingEventEntity[] = [];
    for (const item of items) {
      const site = siteBySession.get(item.sessionId) ?? 'landing';
      if (!(await isEnabled(site))) continue;
      const payload =
        site === 'tools'
          ? sanitizeToolsEventPayload(item.payload)
          : (item.payload ?? null);
      rows.push(
        this.eventRepository.create({
          sessionId: item.sessionId,
          name: item.name,
          payload,
          path: item.path ?? null,
          occurredAt: new Date(item.occurredAt),
        }),
      );
    }
    if (rows.length === 0) return [];
    return this.eventRepository.save(rows);
  }

  private async resolveSessionSites(
    sessionIds: string[],
  ): Promise<Map<string, TrackingSite>> {
    const unique = [...new Set(sessionIds)];
    const sessions = await this.sessionRepository.find({
      where: { id: In(unique) },
      select: { id: true, site: true },
    });
    return new Map(sessions.map((session) => [session.id, session.site]));
  }

  /** No-ops when `heatmapEnabled` is off - same defense-in-depth as `recordEvents`. */
  async recordClicks(
    items: CreateClickItemDto[],
    site: TrackingSite = 'landing',
  ): Promise<TrackingClickEntity[]> {
    const settings = await this.trackingSettingsService.getOrCreate(site);
    if (!settings.heatmapEnabled) return [];

    const rows = items.map((item) =>
      this.clickRepository.create({
        site,
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
   *
   * Sessions from a site where recording is never allowed (the tools hub,
   * Story 25) are rejected outright with a 400, before anything is sent to
   * R2 - that's a client bug or abuse, not a toggle state.
   */
  async recordSessionChunk(
    sessionId: string,
    sequence: number,
    events: unknown[],
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (session && !isRecordingAllowedForSite(session.site ?? 'landing')) {
      throw new BadRequestException(
        `Session recording is not allowed for site "${session.site}"`,
      );
    }

    const settings = await this.trackingSettingsService.getOrCreate(
      session?.site ?? 'landing',
    );
    if (!settings.sessionRecordingEnabled) return null;
    if (!session || !session.recordingSampled) return null;

    return this.trackingRecordingService.uploadChunk(
      sessionId,
      sequence,
      events,
    );
  }

  /** Full session rows (IP + geo + device/browser) for the CMS's visitor detail list - admin-only, no pagination (matches `TrackingRecordingService.getSessionsWithRecording`'s convention at this traffic volume). */
  async getVisitors(
    site: TrackingSite = 'landing',
  ): Promise<TrackingSessionEntity[]> {
    return this.sessionRepository.find({
      where: { site },
      order: { startedAt: 'DESC' },
    });
  }

  /** Pageviews scoped to one site through their session. */
  private sitePageviews(site: TrackingSite) {
    return this.pageviewRepository
      .createQueryBuilder('pageview')
      .innerJoin(
        TrackingSessionEntity,
        'pv_session',
        'pv_session.id = pageview.sessionId AND pv_session.site = :site',
        { site },
      );
  }

  private siteSessions(site: TrackingSite) {
    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.site = :site', { site });
  }

  /**
   * Event counts per tool for the CMS tool list (Story 25): `tool_view`
   * and `tool_calculate` events from the tools site in the last `days`.
   */
  async getToolUsage(
    days = 30,
  ): Promise<{ toolId: string; name: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin(
        TrackingSessionEntity,
        'ev_session',
        "ev_session.id = event.sessionId AND ev_session.site = 'tools'",
      )
      .select("JSON_UNQUOTE(JSON_EXTRACT(event.payload, '$.toolId'))", 'toolId')
      .addSelect('event.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('event.occurredAt >= :since', { since })
      .andWhere('event.name IN (:...names)', {
        names: ['tool_view', 'tool_calculate', 'donate_click'],
      })
      .groupBy('toolId')
      .addGroupBy('event.name')
      .getRawMany<{ toolId: string | null; name: string; count: string }>();
    return rows
      .filter((row) => row.toolId)
      .map((row) => ({
        toolId: row.toolId as string,
        name: row.name,
        count: Number(row.count),
      }));
  }

  /** `donate_click` counts per donation option and tool (last `days`). */
  async getDonationClicks(
    days = 30,
  ): Promise<{ donationOptionId: string; toolId: string; count: number }[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin(
        TrackingSessionEntity,
        'ev_session',
        "ev_session.id = event.sessionId AND ev_session.site = 'tools'",
      )
      .select(
        "JSON_UNQUOTE(JSON_EXTRACT(event.payload, '$.donationOptionId'))",
        'donationOptionId',
      )
      .addSelect(
        "JSON_UNQUOTE(JSON_EXTRACT(event.payload, '$.toolId'))",
        'toolId',
      )
      .addSelect('COUNT(*)', 'count')
      .where('event.occurredAt >= :since', { since })
      .andWhere('event.name = :name', { name: 'donate_click' })
      .groupBy('donationOptionId')
      .addGroupBy('toolId')
      .getRawMany<{
        donationOptionId: string | null;
        toolId: string | null;
        count: string;
      }>();
    return rows
      .filter((row) => row.donationOptionId)
      .map((row) => ({
        donationOptionId: row.donationOptionId as string,
        toolId: row.toolId ?? 'unknown',
        count: Number(row.count),
      }));
  }

  async getOverview(site: TrackingSite = 'landing'): Promise<TrackingOverview> {
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
      this.sitePageviews(site)
        .where('pageview.enteredAt >= :todayStart', { todayStart })
        .getCount(),
      this.siteSessions(site)
        .andWhere('session.startedAt >= :activeSince', { activeSince })
        .getCount(),
      this.siteSessions(site)
        .select('COUNT(DISTINCT session.visitorId)', 'count')
        .getRawOne<{ count: string }>(),
      this.sitePageviews(site)
        .select('DATE(pageview.enteredAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .groupBy('date')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; count: string }>(),
      this.sitePageviews(site)
        .select('pageview.path', 'path')
        .addSelect('COUNT(*)', 'count')
        .groupBy('pageview.path')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ path: string; count: string }>(),
      this.siteSessions(site)
        .select('session.referrer', 'referrer')
        .addSelect('COUNT(*)', 'count')
        .andWhere('session.referrer IS NOT NULL')
        .groupBy('session.referrer')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ referrer: string; count: string }>(),
      this.siteSessions(site)
        .select('session.deviceType', 'device')
        .addSelect('COUNT(*)', 'count')
        .groupBy('session.deviceType')
        .orderBy('count', 'DESC')
        .getRawMany<{ device: string; count: string }>(),
      this.siteSessions(site)
        .select('session.country', 'country')
        .addSelect('session.city', 'city')
        .addSelect('session.latitude', 'latitude')
        .addSelect('session.longitude', 'longitude')
        .addSelect('COUNT(*)', 'count')
        .andWhere('session.latitude IS NOT NULL')
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

    const topCountryRaw = await this.siteSessions(site)
      .select('session.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .andWhere('session.country IS NOT NULL')
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
