import { successResponse } from '@enem-landing/backend-utils';
import { benchmark } from '@enem-landing/shared-utils';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { SystemSettingsService } from '../system-settings/system-settings.service.js';
import { UploadFileDto } from './dto/upload-file.dto.js';
import { FileEntity } from './file.entity.js';

const SYSTEM_ID = 'SYSTEM';

interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  publicUrlBase: string;
}

@Injectable()
export class UploadsService {
  private readonly constructorName = this.constructor.name;

  constructor(
    @InjectRepository(FileEntity)
    private readonly repo: Repository<FileEntity>,
    private readonly systemSettings: SystemSettingsService,
  ) {}

  /**
   * DB-backed (`system_settings` table) with an env var fallback per key —
   * see `SystemSettingsService`. Lets R2 credentials be rotated from
   * `enem-landing-cms`'s settings page (Story 07) without a redeploy, same
   * as mau-account-api.
   */
  private async getR2Config(): Promise<R2Config> {
    const [accessKeyId, secretAccessKey, endpoint, bucket, publicUrlBase] =
      await Promise.all([
        this.systemSettings.get('R2_ACCESS_KEY_ID'),
        this.systemSettings.get('R2_SECRET_ACCESS_KEY'),
        this.systemSettings.get('R2_ENDPOINT'),
        this.systemSettings.get('R2_BUCKET_NAME'),
        this.systemSettings.get('R2_PUBLIC_URL_BASE'),
      ]);

    return { accessKeyId, secretAccessKey, endpoint, bucket, publicUrlBase };
  }

  private buildClient(
    config: Pick<R2Config, 'accessKeyId' | 'secretAccessKey' | 'endpoint'>,
  ): S3Client {
    return new S3Client({
      region: 'auto',
      // A trailing slash on the endpoint makes the SDK mis-sign the request
      // path against R2 (surfaces as a generic 401, not a clear signature
      // error) — strip it defensively regardless of how it was entered.
      endpoint: config.endpoint.replace(/\/$/, ''),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
    uploaderId: string,
  ) {
    return benchmark(`${this.constructorName}@upload`, async () => {
      if (!file) {
        throw new BadRequestException('File is required');
      }
      if (file.size > dto.maxSize) {
        throw new BadRequestException(
          `File size exceeds the maximum of ${dto.maxSize} bytes`,
        );
      }
      if (!dto.allowedMime.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allowed`,
        );
      }

      const config = await this.getR2Config();
      const client = this.buildClient(config);

      const id = randomUUID();
      const ext = this.resolveExtension(file.originalname, file.mimetype);
      const key = `${dto.app}/${dto.purpose}/${id}.${ext}`;

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const url = `${config.publicUrlBase.replace(/\/$/, '')}/${key}`;

      await this.repo.save(
        this.repo.create({
          id,
          app: dto.app,
          purpose: dto.purpose,
          uploaderId: uploaderId === SYSTEM_ID ? undefined : uploaderId,
          mime: file.mimetype,
          size: file.size,
          key,
          url,
        }),
      );

      return successResponse(201, 'File uploaded successfully', { id, url });
    });
  }

  async remove(id: string, requesterId: string) {
    return benchmark(`${this.constructorName}@remove`, async () => {
      const file = await this.repo.findOne({ where: { id } });
      if (!file) {
        throw new NotFoundException('File not found');
      }

      const isSystem = requesterId === SYSTEM_ID;
      const isOwner = file.uploaderId === requesterId;
      if (!isSystem && !isOwner) {
        throw new ForbiddenException('Not allowed to delete this file');
      }

      const config = await this.getR2Config();
      const client = this.buildClient(config);
      await client.send(
        new DeleteObjectCommand({ Bucket: config.bucket, Key: file.key }),
      );
      await this.repo.delete({ id });

      return successResponse(200, 'File deleted successfully');
    });
  }

  private resolveExtension(originalname: string, mimetype: string): string {
    const fromName = originalname?.includes('.')
      ? originalname.split('.').pop()
      : undefined;
    if (fromName) return fromName.toLowerCase();
    const fromMime = mimetype.split('/').pop();
    return (fromMime || 'bin').toLowerCase();
  }
}
