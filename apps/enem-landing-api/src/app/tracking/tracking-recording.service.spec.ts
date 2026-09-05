import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@enem-landing/shared-utils', () => ({
  createAxiosInstance: vi.fn(() => mockClient),
}));

const { TrackingRecordingService } =
  await import('./tracking-recording.service.js');

describe('TrackingRecordingService', () => {
  let chunkRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let sessionRepo: { find: ReturnType<typeof vi.fn> };
  let pageviewRepo: { find: ReturnType<typeof vi.fn> };
  let scheduler: {
    createCronJob: ReturnType<typeof vi.fn>;
    runWithLock: ReturnType<typeof vi.fn>;
  };
  let service: InstanceType<typeof TrackingRecordingService>;

  beforeEach(() => {
    mockClient.post.mockReset();
    mockClient.delete.mockReset();
    chunkRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 'chunk-1', ...entity })),
      find: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      createQueryBuilder: vi.fn(),
    };
    sessionRepo = { find: vi.fn().mockResolvedValue([]) };
    pageviewRepo = { find: vi.fn().mockResolvedValue([]) };
    scheduler = {
      createCronJob: vi.fn(),
      runWithLock: vi.fn((_, task) => task()),
    };
    service = new TrackingRecordingService(
      chunkRepo as never,
      sessionRepo as never,
      pageviewRepo as never,
      scheduler as never,
    );
  });

  describe('uploadChunk', () => {
    it('gzips the events, uploads via the internal endpoint, and stores the returned id/url', async () => {
      mockClient.post.mockResolvedValue({
        data: { id: 'upload-1', url: 'https://r2.example.com/x.json.gz' },
      });

      const result = await service.uploadChunk('session-1', 2, [
        { type: 'mutation' },
      ]);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/uploads/internal',
        expect.objectContaining({
          app: 'enem-landing-web',
          purpose: 'user-activity-tracking',
        }),
      );
      expect(chunkRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          sequence: 2,
          uploadId: 'upload-1',
          url: 'https://r2.example.com/x.json.gz',
        }),
      );
      expect(result.id).toBe('chunk-1');
    });
  });

  describe('getSessionsWithRecording', () => {
    it('returns an empty array when no chunk exists for any session', async () => {
      chunkRepo.createQueryBuilder.mockReturnValue({
        select: () => ({
          getRawMany: () => Promise.resolve([]),
        }),
      });

      const result = await service.getSessionsWithRecording();
      expect(result).toEqual([]);
      expect(sessionRepo.find).not.toHaveBeenCalled();
    });

    it('joins session info with its distinct pageview paths', async () => {
      chunkRepo.createQueryBuilder.mockReturnValue({
        select: () => ({
          getRawMany: () => Promise.resolve([{ sessionId: 'session-1' }]),
        }),
      });
      sessionRepo.find.mockResolvedValue([
        {
          id: 'session-1',
          deviceType: 'desktop',
          browserName: 'Chrome',
          startedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);
      pageviewRepo.find.mockResolvedValue([
        { sessionId: 'session-1', path: '/' },
        { sessionId: 'session-1', path: '/about' },
        { sessionId: 'session-1', path: '/' },
      ]);

      const result = await service.getSessionsWithRecording();

      expect(result).toEqual([
        {
          id: 'session-1',
          deviceType: 'desktop',
          browserName: 'Chrome',
          startedAt: '2026-01-01T00:00:00.000Z',
          pageviewCount: 3,
          paths: ['/', '/about'],
        },
      ]);
    });
  });

  it('getRecordingChunks orders chunks by sequence', async () => {
    await service.getRecordingChunks('session-1');
    expect(chunkRepo.find).toHaveBeenCalledWith({
      where: { sessionId: 'session-1' },
      order: { sequence: 'ASC' },
    });
  });

  describe('pruneOldRecordings', () => {
    it('deletes both the R2 object and the row for each old chunk', async () => {
      chunkRepo.find.mockResolvedValue([
        { id: 'chunk-1', uploadId: 'upload-1' },
        { id: 'chunk-2', uploadId: 'upload-2' },
      ]);
      mockClient.delete.mockResolvedValue(undefined);

      await service.pruneOldRecordings();

      expect(mockClient.delete).toHaveBeenCalledWith(
        '/uploads/internal/upload-1',
      );
      expect(mockClient.delete).toHaveBeenCalledWith(
        '/uploads/internal/upload-2',
      );
      expect(chunkRepo.delete).toHaveBeenCalledWith('chunk-1');
      expect(chunkRepo.delete).toHaveBeenCalledWith('chunk-2');
    });

    it('keeps the row (does not delete it) when the R2 delete call fails, so the next run retries', async () => {
      chunkRepo.find.mockResolvedValue([
        { id: 'chunk-1', uploadId: 'upload-1' },
      ]);
      mockClient.delete.mockRejectedValue(new Error('network error'));

      await service.pruneOldRecordings();

      expect(chunkRepo.delete).not.toHaveBeenCalled();
    });

    it('does nothing when there are no chunks past the retention window', async () => {
      chunkRepo.find.mockResolvedValue([]);
      await service.pruneOldRecordings();
      expect(mockClient.delete).not.toHaveBeenCalled();
    });
  });

  it('triggerPruneNow runs through the scheduler lock under the retention task id', async () => {
    await service.triggerPruneNow();
    expect(scheduler.runWithLock).toHaveBeenCalledWith(
      'tracking-recording-retention',
      expect.any(Function),
    );
  });
});
