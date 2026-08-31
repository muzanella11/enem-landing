import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UploadsService } from './uploads.service.js';
import { FileEntity } from './file.entity.js';

const sendMock = vi.fn().mockResolvedValue({});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function S3ClientMock() {
    return { send: sendMock };
  }),
  PutObjectCommand: vi.fn(function PutObjectCommandMock(
    this: { input: unknown },
    input: unknown,
  ) {
    this.input = input;
  }),
  DeleteObjectCommand: vi.fn(function DeleteObjectCommandMock(
    this: { input: unknown },
    input: unknown,
  ) {
    this.input = input;
  }),
}));

const r2Config = {
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_ENDPOINT: 'https://r2.example.com/',
  R2_BUCKET_NAME: 'bucket',
  R2_PUBLIC_URL_BASE: 'https://cdn.example.com/',
} as const;

describe('UploadsService', () => {
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let systemSettings: { get: ReturnType<typeof vi.fn> };
  let service: UploadsService;

  beforeEach(() => {
    sendMock.mockClear();
    repo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
      create: vi.fn((data) => data),
      delete: vi.fn(),
    };
    systemSettings = {
      get: vi.fn((key: keyof typeof r2Config) =>
        Promise.resolve(r2Config[key]),
      ),
    };
    service = new UploadsService(repo as never, systemSettings as never);
  });

  describe('upload', () => {
    const dto = {
      app: 'enem-landing-cms',
      purpose: 'avatar',
      maxSize: 1024,
      allowedMime: ['image/png'],
    };

    it('rejects when no file is provided', async () => {
      await expect(service.upload(undefined, dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a file larger than dto.maxSize', async () => {
      const file = {
        size: 2048,
        mimetype: 'image/png',
        originalname: 'a.png',
        buffer: Buffer.from(''),
      } as Express.Multer.File;
      await expect(service.upload(file, dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a disallowed mime type', async () => {
      const file = {
        size: 10,
        mimetype: 'image/gif',
        originalname: 'a.gif',
        buffer: Buffer.from(''),
      } as Express.Multer.File;
      await expect(service.upload(file, dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('uploads to R2 and persists a FileEntity row', async () => {
      const file = {
        size: 10,
        mimetype: 'image/png',
        originalname: 'avatar.png',
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      const result = await service.upload(file, dto, 'user-1');

      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          app: 'enem-landing-cms',
          purpose: 'avatar',
          uploaderId: 'user-1',
          mime: 'image/png',
          key: expect.stringMatching(/^enem-landing-cms\/avatar\/.+\.png$/),
          url: expect.stringMatching(
            /^https:\/\/cdn\.example\.com\/enem-landing-cms\/avatar\/.+\.png$/,
          ),
        }),
      );
      expect(result.data).toEqual(
        expect.objectContaining({ url: expect.any(String) }),
      );
    });

    it('does not attribute uploads made by the SYSTEM account to a real user', async () => {
      const file = {
        size: 10,
        mimetype: 'image/png',
        originalname: 'avatar.png',
        buffer: Buffer.from('data'),
      } as Express.Multer.File;

      await service.upload(file, dto, 'SYSTEM');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ uploaderId: undefined }),
      );
    });
  });

  describe('remove', () => {
    const file: FileEntity = {
      id: 'file-1',
      app: 'enem-landing-cms',
      purpose: 'avatar',
      uploaderId: 'user-1',
      mime: 'image/png',
      size: 10,
      key: 'enem-landing-cms/avatar/file-1.png',
      url: 'https://cdn.example.com/enem-landing-cms/avatar/file-1.png',
      createdAt: new Date(),
    };

    it('throws when the file does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('allows the owner to delete their own file', async () => {
      repo.findOne.mockResolvedValue(file);
      await service.remove('file-1', 'user-1');
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(repo.delete).toHaveBeenCalledWith({ id: 'file-1' });
    });

    it('allows the SYSTEM account to delete any file', async () => {
      repo.findOne.mockResolvedValue(file);
      await service.remove('file-1', 'SYSTEM');
      expect(repo.delete).toHaveBeenCalledWith({ id: 'file-1' });
    });

    it('rejects deletion by a non-owner, non-system requester', async () => {
      repo.findOne.mockResolvedValue(file);
      await expect(service.remove('file-1', 'someone-else')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
