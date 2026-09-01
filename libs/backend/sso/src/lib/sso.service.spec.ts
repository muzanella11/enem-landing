import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SsoService } from './sso.service.js';

const axiosMock = {
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@enem-landing/shared-utils', () => ({
  createAxiosInstance: vi.fn(() => axiosMock),
  benchmark: async (_label: string, fn: () => Promise<unknown>) => fn(),
  StaticAccount: {
    SYSTEM: { fullname: 'System', email: 'system@enem-landing.local', password: 'letmeinfortesting' },
  },
  StaticAccountSystem: 'SYSTEM',
}));

describe('SsoService', () => {
  let service: SsoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SsoService();
  });

  describe('extractToken', () => {
    it('extracts the bearer token from the Authorization header', () => {
      const req = { headers: { authorization: 'Bearer abc123' } } as never;
      expect(service.extractToken(req)).toBe('abc123');
    });

    it('throws when the header is missing', () => {
      const req = { headers: {} } as never;
      expect(() => service.extractToken(req)).toThrow(UnauthorizedException);
    });
  });

  describe('whoAmI', () => {
    it('returns the whoami envelope on success', async () => {
      const envelope = { statusCode: 200, message: 'Success', data: { id: 'user-1' } };
      axiosMock.post.mockResolvedValue(envelope);

      await expect(service.whoAmI('token')).resolves.toBe(envelope);
    });

    it('throws UnauthorizedException when the token is empty', async () => {
      await expect(service.whoAmI('')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the call fails', async () => {
      axiosMock.post.mockRejectedValue(new Error('network error'));
      await expect(service.whoAmI('token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login / loginAsSystem', () => {
    it('login returns the signin envelope', async () => {
      const envelope = { statusCode: 200, message: 'Success', data: { token: 'jwt' } };
      axiosMock.post.mockResolvedValue(envelope);

      await expect(service.login('a@example.com', 'secret')).resolves.toBe(envelope);
    });

    it('loginAsSystem signs in with the StaticAccountSystem fixture', async () => {
      axiosMock.post.mockResolvedValue({
        statusCode: 200,
        message: 'Success',
        data: { token: 'system-jwt' },
      });

      await expect(service.loginAsSystem()).resolves.toBe('system-jwt');
      expect(axiosMock.post).toHaveBeenCalledWith('/auth/signin', {
        email: 'system@enem-landing.local',
        password: 'letmeinfortesting',
      });
    });
  });

  describe('uploadFile', () => {
    it('uploads and returns the file id/url', async () => {
      axiosMock.post.mockResolvedValue({
        statusCode: 201,
        message: 'Success',
        data: { id: 'file-1', url: 'https://cdn.example.com/file-1.png' },
      });

      const result = await service.uploadFile(
        'token',
        { buffer: Buffer.from('data'), filename: 'a.png', mimetype: 'image/png' },
        { app: 'enem-landing-api', purpose: 'experience', maxSize: 1024, allowedMime: ['image/png'] },
      );

      expect(result).toEqual({ id: 'file-1', url: 'https://cdn.example.com/file-1.png' });
      expect(axiosMock.post).toHaveBeenCalledWith('/uploads', expect.anything(), expect.anything());
    });

    it('maps a 400 response to BadRequestException', async () => {
      axiosMock.post.mockRejectedValue({ response: { status: 400, data: { message: 'File too large' } } });

      await expect(
        service.uploadFile(
          'token',
          { buffer: Buffer.from(''), filename: 'a.png', mimetype: 'image/png' },
          { app: 'x', purpose: 'y', maxSize: 1, allowedMime: [] },
        ),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('deleteFile', () => {
    it('calls DELETE /uploads/:id', async () => {
      axiosMock.delete.mockResolvedValue(undefined);
      await service.deleteFile('token', 'file-1');
      expect(axiosMock.delete).toHaveBeenCalledWith('/uploads/file-1');
    });

    it('maps a 404 response to NotFoundException', async () => {
      axiosMock.delete.mockRejectedValue({ response: { status: 404, data: { message: 'Not found' } } });
      await expect(service.deleteFile('token', 'missing')).rejects.toMatchObject({ status: 404 });
    });
  });
});
