import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./geo-lookup.js', () => ({
  lookupGeo: vi.fn().mockResolvedValue({
    country: 'ID',
    region: 'JK',
    city: 'Jakarta',
    latitude: -6.2,
    longitude: 106.8,
  }),
}));

vi.mock('ua-parser-js', () => ({
  UAParser: vi.fn().mockImplementation(function UAParserMock() {
    return {
      getResult: () => ({
        browser: { name: 'Chrome', version: '128.0.0' },
        os: { name: 'Android', version: '14' },
        device: { type: 'mobile', vendor: 'Samsung', model: 'SM-G991B' },
        engine: { name: 'Blink', version: '128.0.0' },
        cpu: { architecture: 'arm64' },
      }),
    };
  }),
}));

const { TrackingService } = await import('./tracking.service.js');

describe('TrackingService', () => {
  let sessionRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let pageviewRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let eventRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let clickRepo: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let settingsService: { getOrCreate: ReturnType<typeof vi.fn> };
  let recordingService: { uploadChunk: ReturnType<typeof vi.fn> };
  let service: InstanceType<typeof TrackingService>;

  beforeEach(() => {
    sessionRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 'session-1', ...entity })),
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
    };
    pageviewRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((rows) => Promise.resolve(rows)),
      findOne: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    };
    eventRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((rows) => Promise.resolve(rows)),
    };
    clickRepo = {
      create: vi.fn((data) => data),
      save: vi.fn((rows) => Promise.resolve(rows)),
    };
    settingsService = {
      getOrCreate: vi.fn().mockResolvedValue({
        eventsEnabled: true,
        heatmapEnabled: true,
        sessionRecordingEnabled: true,
        sessionRecordingSampleRatePct: 100,
      }),
    };
    recordingService = {
      uploadChunk: vi.fn().mockResolvedValue({ id: 'chunk-1', sequence: 0 }),
    };
    service = new TrackingService(
      sessionRepo as never,
      pageviewRepo as never,
      eventRepo as never,
      clickRepo as never,
      settingsService as never,
      recordingService as never,
    );
  });

  it('createSession resolves device/browser/os and geo from the request', async () => {
    const result = await service.createSession(
      { visitorId: 'visitor-1' },
      '8.8.8.8',
      'some-user-agent',
      'en-US,en;q=0.9',
    );

    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        visitorId: 'visitor-1',
        deviceType: 'mobile',
        deviceVendor: 'Samsung',
        deviceModel: 'SM-G991B',
        browserName: 'Chrome',
        browserVersion: '128.0.0',
        engineName: 'Blink',
        engineVersion: '128.0.0',
        osName: 'Android',
        osVersion: '14',
        cpuArchitecture: 'arm64',
        language: 'en-US',
        ipAddress: '8.8.8.8',
        country: 'ID',
        city: 'Jakarta',
        latitude: -6.2,
        longitude: 106.8,
      }),
    );
    expect(result.id).toBe('session-1');
  });

  it('createSession prefers the client-reported language/timezone/screen over header fallback', async () => {
    await service.createSession(
      {
        visitorId: 'visitor-1',
        language: 'id-ID',
        timezone: 'Asia/Jakarta',
        screenWidth: 390,
        screenHeight: 844,
      },
      '8.8.8.8',
      'some-user-agent',
      'en-US,en;q=0.9',
    );

    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'id-ID',
        timezone: 'Asia/Jakarta',
        screenWidth: 390,
        screenHeight: 844,
      }),
    );
  });

  it('recordPageviews batches items with a null durationMs', async () => {
    await service.recordPageviews([
      { sessionId: 'session-1', path: '/', enteredAt: '2026-01-01T00:00:00Z' },
    ]);

    expect(pageviewRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-1', durationMs: null }),
    );
    expect(pageviewRepo.save).toHaveBeenCalled();
  });

  it('recordPageviewDuration throws NotFoundException when missing', async () => {
    pageviewRepo.findOne.mockResolvedValue(null);
    await expect(
      service.recordPageviewDuration('missing', 1000),
    ).rejects.toThrow(NotFoundException);
  });

  it('recordPageviewDuration updates an existing pageview', async () => {
    pageviewRepo.findOne.mockResolvedValue({ id: 'pv-1' });
    await service.recordPageviewDuration('pv-1', 1500);
    expect(pageviewRepo.update).toHaveBeenCalledWith('pv-1', {
      durationMs: 1500,
    });
  });

  describe('recordEvents', () => {
    it('persists events when eventsEnabled is true', async () => {
      const result = await service.recordEvents([
        {
          sessionId: 'session-1',
          name: 'contact_click',
          payload: { foo: 'bar' },
          occurredAt: '2026-01-01T00:00:00Z',
        },
      ]);

      expect(eventRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          name: 'contact_click',
          payload: { foo: 'bar' },
        }),
      );
      expect(eventRepo.save).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('no-ops and writes nothing when eventsEnabled is false', async () => {
      settingsService.getOrCreate.mockResolvedValue({ eventsEnabled: false });

      const result = await service.recordEvents([
        {
          sessionId: 'session-1',
          name: 'contact_click',
          occurredAt: '2026-01-01T00:00:00Z',
        },
      ]);

      expect(result).toEqual([]);
      expect(eventRepo.create).not.toHaveBeenCalled();
      expect(eventRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('recordClicks', () => {
    it('persists clicks when heatmapEnabled is true', async () => {
      const result = await service.recordClicks([
        {
          path: '/',
          xPct: 0.5,
          yPct: 0.5,
          deviceBucket: 'desktop',
          occurredAt: '2026-01-01T00:00:00Z',
        },
      ]);

      expect(clickRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/', xPct: 0.5, yPct: 0.5 }),
      );
      expect(result).toHaveLength(1);
    });

    it('no-ops and writes nothing when heatmapEnabled is false', async () => {
      settingsService.getOrCreate.mockResolvedValue({ heatmapEnabled: false });

      const result = await service.recordClicks([
        {
          path: '/',
          xPct: 0.5,
          yPct: 0.5,
          deviceBucket: 'desktop',
          occurredAt: '2026-01-01T00:00:00Z',
        },
      ]);

      expect(result).toEqual([]);
      expect(clickRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('createSession recordingSampled', () => {
    it('is always true when the sample rate is 100', async () => {
      settingsService.getOrCreate.mockResolvedValue({
        sessionRecordingEnabled: true,
        sessionRecordingSampleRatePct: 100,
      });

      await service.createSession(
        { visitorId: 'visitor-1' },
        '8.8.8.8',
        'ua',
        undefined,
      );

      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ recordingSampled: true }),
      );
    });

    it('is always false when sessionRecordingEnabled is off, regardless of sample rate', async () => {
      settingsService.getOrCreate.mockResolvedValue({
        sessionRecordingEnabled: false,
        sessionRecordingSampleRatePct: 100,
      });

      await service.createSession(
        { visitorId: 'visitor-1' },
        '8.8.8.8',
        'ua',
        undefined,
      );

      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ recordingSampled: false }),
      );
    });
  });

  describe('recordSessionChunk', () => {
    it('uploads the chunk when recording is enabled and the session was sampled', async () => {
      sessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        recordingSampled: true,
      });

      const result = await service.recordSessionChunk('session-1', 0, [
        { type: 'test' },
      ]);

      expect(recordingService.uploadChunk).toHaveBeenCalledWith(
        'session-1',
        0,
        [{ type: 'test' }],
      );
      expect(result).toEqual({ id: 'chunk-1', sequence: 0 });
    });

    it('no-ops when sessionRecordingEnabled is off', async () => {
      settingsService.getOrCreate.mockResolvedValue({
        sessionRecordingEnabled: false,
      });
      sessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        recordingSampled: true,
      });

      const result = await service.recordSessionChunk('session-1', 0, []);

      expect(result).toBeNull();
      expect(recordingService.uploadChunk).not.toHaveBeenCalled();
    });

    it('no-ops when the session was not sampled', async () => {
      sessionRepo.findOne.mockResolvedValue({
        id: 'session-1',
        recordingSampled: false,
      });

      const result = await service.recordSessionChunk('session-1', 0, []);

      expect(result).toBeNull();
      expect(recordingService.uploadChunk).not.toHaveBeenCalled();
    });

    it('no-ops when the session does not exist', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      const result = await service.recordSessionChunk('missing', 0, []);

      expect(result).toBeNull();
      expect(recordingService.uploadChunk).not.toHaveBeenCalled();
    });
  });
});
