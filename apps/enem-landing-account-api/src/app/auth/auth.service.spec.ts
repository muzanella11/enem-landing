import { Role } from '@enem-landing/shared-definitions';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UserEntity } from '../users/user.entity.js';

vi.mock('bcrypt');

const buildUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: 'user-1',
  fullname: 'Test Admin',
  email: 'admin@example.com',
  passwordHash: 'hashed',
  role: Role.Admin,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService', () => {
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updatePassword: ReturnType<typeof vi.fn>;
  };
  let jwtService: { sign: ReturnType<typeof vi.fn> };
  let redisService: {
    setValue: ReturnType<typeof vi.fn>;
    deleteValue: ReturnType<typeof vi.fn>;
    getValue: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(() => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updatePassword: vi.fn(),
    };
    jwtService = { sign: vi.fn().mockReturnValue('signed.jwt.token') };
    redisService = {
      setValue: vi.fn(),
      deleteValue: vi.fn(),
      getValue: vi.fn(),
    };

    service = new AuthService(
      usersService as never,
      jwtService as never,
      redisService as never,
    );

    vi.clearAllMocks();
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockReset();
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('validateUser', () => {
    it('returns the user when the password matches', async () => {
      const user = buildUser();
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      await expect(
        service.validateUser('admin@example.com', 'secret'),
      ).resolves.toBe(user);
    });

    it('throws when the user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.validateUser('missing@example.com', 'secret'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when the password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(
        service.validateUser('admin@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signin', () => {
    it('signs a JWT and stores the session in Redis', async () => {
      const user = buildUser();

      const result = await service.signin(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        },
        expect.objectContaining({ expiresIn: expect.any(Number) }),
      );
      expect(redisService.setValue).toHaveBeenCalledWith(
        'auth:user-1:token',
        'signed.jwt.token',
        expect.any(Number),
      );
      expect(result.data).toEqual({ token: 'signed.jwt.token' });
    });
  });

  describe('whoami', () => {
    it('returns the JWT payload as-is', async () => {
      const payload = {
        id: 'user-1',
        fullname: 'Test Admin',
        email: 'admin@example.com',
        role: Role.Admin,
      };
      const result = await service.whoami(payload);
      expect(result.data).toEqual(payload);
    });
  });

  describe('signout', () => {
    it('deletes the Redis session key', async () => {
      await service.signout('user-1');
      expect(redisService.deleteValue).toHaveBeenCalledWith(
        'auth:user-1:token',
      );
    });
  });

  describe('changePassword', () => {
    it('rejects when new password and confirmation differ', async () => {
      await expect(
        service.changePassword('user-1', {
          currentPassword: 'old-password',
          newPassword: 'new-password-1',
          confirmPassword: 'new-password-2',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the current password is wrong', async () => {
      usersService.findById.mockResolvedValue(buildUser());
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrong-password',
          newPassword: 'new-password-1',
          confirmPassword: 'new-password-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates the password hash and invalidates the active session', async () => {
      usersService.findById.mockResolvedValue(buildUser());
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue(
        'new-hashed-password',
      );

      await service.changePassword('user-1', {
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      });

      expect(usersService.updatePassword).toHaveBeenCalledWith(
        'user-1',
        'new-hashed-password',
      );
      expect(redisService.deleteValue).toHaveBeenCalledWith(
        'auth:user-1:token',
      );
    });
  });

  describe('signup', () => {
    it('is disabled by default (ALLOW_SIGNUP unset)', async () => {
      await expect(
        service.signup({
          fullname: 'New User',
          email: 'new@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
