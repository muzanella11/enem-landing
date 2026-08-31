import { SystemSettingsService } from './system-settings.service.js';

describe('SystemSettingsService', () => {
  let repo: { find: ReturnType<typeof vi.fn>; findOne: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let service: SystemSettingsService;
  const originalEnv = process.env['R2_BUCKET_NAME'];

  beforeEach(() => {
    repo = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve({ id: 'setting-1', ...entity })),
      create: vi.fn((data) => data),
      update: vi.fn(),
    };
    service = new SystemSettingsService(repo as never);
  });

  afterEach(() => {
    if (originalEnv === undefined) delete process.env['R2_BUCKET_NAME'];
    else process.env['R2_BUCKET_NAME'] = originalEnv;
  });

  describe('get', () => {
    it('returns the DB value when a row exists', async () => {
      repo.findOne.mockResolvedValue({ key: 'R2_BUCKET_NAME', value: 'from-db' });
      await expect(service.get('R2_BUCKET_NAME')).resolves.toBe('from-db');
    });

    it('falls back to the env var when no row exists', async () => {
      repo.findOne.mockResolvedValue(null);
      process.env['R2_BUCKET_NAME'] = 'from-env';
      await expect(service.get('R2_BUCKET_NAME')).resolves.toBe('from-env');
    });
  });

  describe('getAll', () => {
    it('fills in env-fallback keys missing from the DB', async () => {
      repo.find.mockResolvedValue([]);
      process.env['R2_BUCKET_NAME'] = 'from-env';

      const result = await service.getAll();

      expect(result['R2_BUCKET_NAME']).toBe('from-env');
    });

    it('prefers the DB value over the env var when both exist', async () => {
      repo.find.mockResolvedValue([{ key: 'R2_BUCKET_NAME', value: 'from-db' }]);
      process.env['R2_BUCKET_NAME'] = 'from-env';

      const result = await service.getAll();

      expect(result['R2_BUCKET_NAME']).toBe('from-db');
    });
  });

  describe('upsertMany', () => {
    it('creates a row for a key that does not exist yet', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.upsertMany({ R2_BUCKET_NAME: 'new-bucket' });
      expect(repo.create).toHaveBeenCalledWith({ key: 'R2_BUCKET_NAME', value: 'new-bucket' });
      expect(repo.save).toHaveBeenCalled();
    });

    it('updates an existing row in place', async () => {
      repo.findOne.mockResolvedValue({ id: 'setting-1', key: 'R2_BUCKET_NAME', value: 'old' });
      await service.upsertMany({ R2_BUCKET_NAME: 'new-bucket' });
      expect(repo.update).toHaveBeenCalledWith('setting-1', { value: 'new-bucket' });
    });
  });
});
