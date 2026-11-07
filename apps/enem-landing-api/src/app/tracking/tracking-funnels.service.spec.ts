import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackingFunnelsService } from './tracking-funnels.service.js';

describe('TrackingFunnelsService', () => {
  let funnelRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let pageviewRepo: { find: ReturnType<typeof vi.fn> };
  let eventRepo: { find: ReturnType<typeof vi.fn> };
  let sessionRepo: { find: ReturnType<typeof vi.fn> };
  let service: TrackingFunnelsService;

  beforeEach(() => {
    funnelRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((data) => data),
      save: vi.fn((entity) => Promise.resolve({ id: 'funnel-1', ...entity })),
      remove: vi.fn((entity) => Promise.resolve(entity)),
    };
    pageviewRepo = { find: vi.fn().mockResolvedValue([]) };
    eventRepo = { find: vi.fn().mockResolvedValue([]) };
    sessionRepo = {
      find: vi.fn().mockResolvedValue([{ id: 's1' }, { id: 's2' }]),
    };
    service = new TrackingFunnelsService(
      funnelRepo as never,
      pageviewRepo as never,
      eventRepo as never,
      sessionRepo as never,
    );
  });

  it('update throws NotFoundException when the funnel is missing', async () => {
    funnelRepo.findOne.mockResolvedValue(null);
    await expect(service.update('missing', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove throws NotFoundException when the funnel is missing', async () => {
    funnelRepo.findOne.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  describe('getReport', () => {
    const funnel = {
      id: 'funnel-1',
      name: 'Contact',
      steps: ['/', 'contact_click'],
    };

    it('throws NotFoundException when the funnel is missing', async () => {
      funnelRepo.findOne.mockResolvedValue(null);
      await expect(service.getReport('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns 0 for every step when nobody reaches step 1', async () => {
      funnelRepo.findOne.mockResolvedValue(funnel);
      pageviewRepo.find.mockResolvedValue([]);
      eventRepo.find.mockResolvedValue([]);

      const report = await service.getReport('funnel-1');

      expect(report).toEqual([
        { step: '/', count: 0 },
        { step: 'contact_click', count: 0 },
      ]);
    });

    it('counts a session for a step only once (pageview + event with same name coincidence is deduped by earliest timestamp)', async () => {
      funnelRepo.findOne.mockResolvedValue(funnel);
      pageviewRepo.find.mockImplementation(({ where }) => {
        if (where.path === '/') {
          return Promise.resolve([
            {
              sessionId: 's1',
              path: '/',
              enteredAt: new Date('2026-01-01T00:00:00Z'),
            },
            {
              sessionId: 's2',
              path: '/',
              enteredAt: new Date('2026-01-01T00:05:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      });
      eventRepo.find.mockImplementation(({ where }) => {
        if (where.name === 'contact_click') {
          return Promise.resolve([
            {
              sessionId: 's1',
              name: 'contact_click',
              occurredAt: new Date('2026-01-01T00:01:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const report = await service.getReport('funnel-1');

      expect(report).toEqual([
        { step: '/', count: 2 },
        { step: 'contact_click', count: 1 },
      ]);
    });

    it('does not count a step reached BEFORE the previous step (out-of-order events do not count)', async () => {
      funnelRepo.findOne.mockResolvedValue(funnel);
      // s1 clicked contact_click at 00:00, then visited "/" at 00:05 -
      // the click happened before the funnel's first step, so it must not
      // count as having reached step 2.
      pageviewRepo.find.mockImplementation(({ where }) => {
        if (where.path === '/') {
          return Promise.resolve([
            {
              sessionId: 's1',
              path: '/',
              enteredAt: new Date('2026-01-01T00:05:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      });
      eventRepo.find.mockImplementation(({ where }) => {
        if (where.name === 'contact_click') {
          return Promise.resolve([
            {
              sessionId: 's1',
              name: 'contact_click',
              occurredAt: new Date('2026-01-01T00:00:00Z'),
            },
          ]);
        }
        return Promise.resolve([]);
      });

      const report = await service.getReport('funnel-1');

      expect(report).toEqual([
        { step: '/', count: 1 },
        { step: 'contact_click', count: 0 },
      ]);
    });

    it('only queries the second step among sessions that already reached the first', async () => {
      funnelRepo.findOne.mockResolvedValue(funnel);
      pageviewRepo.find.mockResolvedValue([
        {
          sessionId: 's1',
          path: '/',
          enteredAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);
      eventRepo.find.mockResolvedValue([]);

      await service.getReport('funnel-1');

      expect(eventRepo.find).toHaveBeenCalledWith({
        where: { name: 'contact_click', sessionId: expect.anything() },
      });
    });
  });

  describe('site scoping (Story 25)', () => {
    it('ignores sessions from other sites', async () => {
      funnelRepo.findOne.mockResolvedValue({
        id: 'funnel-1',
        site: 'tools',
        name: 'Tools',
        steps: ['/kalkulator-gaji-bersih'],
      });
      sessionRepo.find.mockResolvedValue([{ id: 'tools-session' }]);
      pageviewRepo.find.mockResolvedValue([
        {
          sessionId: 'landing-session',
          path: '/kalkulator-gaji-bersih',
          enteredAt: new Date('2026-01-01T00:00:00Z'),
        },
        {
          sessionId: 'tools-session',
          path: '/kalkulator-gaji-bersih',
          enteredAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      const report = await service.getReport('funnel-1');

      expect(sessionRepo.find).toHaveBeenCalledWith({
        where: { site: 'tools' },
        select: { id: true },
      });
      expect(report).toEqual([{ step: '/kalkulator-gaji-bersih', count: 1 }]);
    });

    it('findAll filters by site, defaulting to landing', async () => {
      funnelRepo.find.mockResolvedValue([]);
      await service.findAll();
      expect(funnelRepo.find).toHaveBeenCalledWith({
        where: { site: 'landing' },
      });
    });
  });
});
