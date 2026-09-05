import { IsNotEmpty, IsString } from 'class-validator';
import { UploadFileDto } from './upload-file.dto.js';

/**
 * Internal (server-to-server) counterpart of `UploadFileDto` - a JSON
 * body instead of multipart/form-data, since the caller here is another
 * backend service, not a browser form. `app`/`purpose`/`maxSize`/
 * `allowedMime`'s validation (including the `maxSize` `Number(value)`
 * transform, a no-op on an already-numeric JSON value) is inherited
 * unchanged.
 */
export class UploadInternalFileDto extends UploadFileDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsString()
  @IsNotEmpty()
  base64Data!: string;
}
