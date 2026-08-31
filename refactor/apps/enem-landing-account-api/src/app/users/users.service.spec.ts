import { Role } from '@enem-landing/shared-definitions';
import { UsersService } from './users.service.js';
import { UserEntity } from './user.entity.js';

describe('UsersService', () => {
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let service: UsersService;

  beforeEach(() => {
    repo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
      create: vi.fn((data) => data),
      update: vi.fn(),
    };
    service = new UsersService(repo as never);
  });

  it('findByEmail queries by email', async () => {
    await service.findByEmail('a@example.com');
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email: 'a@example.com' },
    });
  });

  it('create persists a new user via the repository', async () => {
    const data = {
      fullname: 'A',
      email: 'a@example.com',
      passwordHash: 'hash',
      role: Role.Admin,
    };
    await service.create(data);
    expect(repo.create).toHaveBeenCalledWith(data);
    expect(repo.save).toHaveBeenCalledWith(data);
  });

  it('upsertByEmail creates when no existing user is found', async () => {
    repo.findOne.mockResolvedValue(null);
    const data = {
      fullname: 'A',
      email: 'a@example.com',
      passwordHash: 'hash',
      role: Role.User,
    };

    await service.upsertByEmail(data);

    expect(repo.create).toHaveBeenCalledWith(data);
  });

  it('upsertByEmail merges into the existing user when found', async () => {
    const existing: UserEntity = {
      id: 'user-1',
      fullname: 'Old Name',
      email: 'a@example.com',
      passwordHash: 'old-hash',
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.findOne.mockResolvedValue(existing);
    const data = {
      fullname: 'New Name',
      email: 'a@example.com',
      passwordHash: 'new-hash',
      role: Role.User,
    };

    await service.upsertByEmail(data);

    expect(repo.save).toHaveBeenCalledWith({ ...existing, ...data });
  });

  it('updatePassword updates only the passwordHash column', async () => {
    await service.updatePassword('user-1', 'new-hash');
    expect(repo.update).toHaveBeenCalledWith('user-1', {
      passwordHash: 'new-hash',
    });
  });
});
