import type {
  TrackingRecordingChunkMeta,
  TrackingRecordingSession,
} from '@enem-landing/shared-types';
import { createAxiosInstance } from '@enem-landing/shared-utils';
import { SchedulerService } from '@enem-landing/backend-scheduler';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { gzipSync } from 'zlib';
import { In, LessThan, Repository } from 'typeorm';
import { TrackingPageviewEntity } from './tracking-pageview.entity.js';
import { TrackingRecordingChunkEntity } from './tracking-recording-chunk.entity.js';
import { TrackingSessionEntity } from './tracking-session.entity.js';

const RETENTION_TASK_ID = 'tracking-recording-retention';
const RETENTION_CRON = '30 2 * * *'; // daily at 02:30
const RETENTION_DAYS = 30;
const MAX_CHUNK_BYTES = 5 * 1024 * 1024;

interface UploadResponseEnvelope {
  data: { id: string; url: string };
}

/**
 * Owns the whole session-recording lifecycle beyond raw ingestion:
 * uploading a chunk to R2 via `enem-landing-account-api`'s internal
 * endpoint, listing recorded sessions + their chunks for CMS replay, and
 * pruning recordings past the retention window (both the DB row and the
 * R2 object, via the matching internal delete endpoint).
 */
@Injectable()
export class TrackingRecordingService implements OnModuleInit {
  private readonly logger = new Logger(TrackingRecordingService.name);

  constructor(
    @InjectRepository(TrackingRecordingChunkEntity)
    private readonly chunkRepository: Repository<TrackingRecordingChunkEntity>,
    @InjectRepository(TrackingSessionEntity)
    private readonly sessionRepository: Repository<TrackingSessionEntity>,
    @InjectRepository(TrackingPageviewEntity)
    private readonly pageviewRepository: Repository<TrackingPageviewEntity>,
    private readonly schedulerService: SchedulerService,
  ) {}

  onModuleInit(): void {
    this.schedulerService.createCronJob(RETENTION_TASK_ID, RETENTION_CRON, () =>
      this.pruneOldRecordings(),
    );
  }

  triggerPruneNow(): Promise<void> {
    return this.schedulerService.runWithLock(RETENTION_TASK_ID, () =>
      this.pruneOldRecordings(),
    );
  }

  private createAccountApiClient() {
    return createAxiosInstance({
      baseURL: process.env['ACCOUNT_API_HOST'] || 'http://localhost:3000',
      customHeaders: {
        'X-Internal-Api-Key': process.env['INTERNAL_API_KEY'] || '',
      },
    });
  }

  async uploadChunk(
    sessionId: string,
    sequence: number,
    events: unknown[],
  ): Promise<TrackingRecordingChunkEntity> {
    const gzipped = gzipSync(Buffer.from(JSON.stringify(events)));
    const client = this.createAccountApiClient();

    // `createAxiosInstance`'s response interceptor unwraps axios's own
    // `AxiosResponse.data` and resolves with the API's `{ data: ... }`
    // envelope directly - axios's own types can't know that, so the cast
    // (not a type param on `.post`) is required, same pattern as
    // `libs/backend/sso`'s `SsoService`.
    const response = (await client.post('/uploads/internal', {
      app: 'enem-landing-web',
      purpose: 'user-activity-tracking',
      filename: `${sessionId}-${sequence}.json.gz`,
      mimeType: 'application/gzip',
      base64Data: gzipped.toString('base64'),
      maxSize: MAX_CHUNK_BYTES,
      allowedMime: ['application/gzip'],
    })) as unknown as UploadResponseEnvelope;

    const chunk = this.chunkRepository.create({
      sessionId,
      sequence,
      uploadId: response.data.id,
      url: response.data.url,
      sizeBytes: gzipped.byteLength,
      occurredAt: new Date(),
    });
    return this.chunkRepository.save(chunk);
  }

  async getSessionsWithRecording(): Promise<TrackingRecordingSession[]> {
    const distinctSessionIds = await this.chunkRepository
      .createQueryBuilder('chunk')
      .select('DISTINCT chunk.sessionId', 'sessionId')
      .getRawMany<{ sessionId: string }>();
    const sessionIds = distinctSessionIds.map((row) => row.sessionId);
    if (sessionIds.length === 0) return [];

    const [sessions, pageviews] = await Promise.all([
      this.sessionRepository.find({ where: { id: In(sessionIds) } }),
      this.pageviewRepository.find({ where: { sessionId: In(sessionIds) } }),
    ]);

    return sessions.map((session) => {
      const ownPageviews = pageviews.filter(
        (pageview) => pageview.sessionId === session.id,
      );
      return {
        id: session.id,
        deviceType: session.deviceType,
        browserName: session.browserName,
        startedAt: session.startedAt.toISOString(),
        pageviewCount: ownPageviews.length,
        paths: [...new Set(ownPageviews.map((pageview) => pageview.path))],
      };
    });
  }

  async getRecordingChunks(
    sessionId: string,
  ): Promise<TrackingRecordingChunkMeta[]> {
    const chunks = await this.chunkRepository.find({
      where: { sessionId },
      order: { sequence: 'ASC' },
    });
    return chunks.map((chunk) => ({
      sequence: chunk.sequence,
      url: chunk.url,
    }));
  }

  async pruneOldRecordings(): Promise<void> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const oldChunks = await this.chunkRepository.find({
      where: { occurredAt: LessThan(cutoff) },
    });
    if (oldChunks.length === 0) return;

    const client = this.createAccountApiClient();
    let deletedCount = 0;

    for (const chunk of oldChunks) {
      try {
        await client.delete(`/uploads/internal/${chunk.uploadId}`);
      } catch (error) {
        // Keep the row so the next run retries rather than losing track
        // of a still-existing R2 object.
        this.logger.warn(
          `Failed to delete R2 object for chunk ${chunk.id}`,
          error,
        );
        continue;
      }
      await this.chunkRepository.delete(chunk.id);
      deletedCount += 1;
    }

    this.logger.log(
      `Pruned ${deletedCount}/${oldChunks.length} recording chunks older than ${RETENTION_DAYS} days`,
    );
  }
}
