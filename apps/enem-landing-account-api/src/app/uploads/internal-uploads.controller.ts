import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InternalApiGuard } from './guard/internal-api.guard.js';
import { UploadInternalFileDto } from './dto/upload-internal-file.dto.js';
import { SYSTEM_ID } from './uploads.constants.js';
import { UploadsService } from './uploads.service.js';

/**
 * Server-to-server counterpart of `UploadsController` - used by
 * `enem-landing-api` to store session-recording chunks in R2 (Story 16),
 * authenticated via `InternalApiGuard` instead of a user JWT. Kept as a
 * separate controller/path rather than adding a second guard onto the
 * existing one, so the human-upload path (CMS, JWT-only) is untouched.
 */
@UseGuards(InternalApiGuard)
@Controller('uploads/internal')
export class InternalUploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  upload(@Body() dto: UploadInternalFileDto) {
    const buffer = Buffer.from(dto.base64Data, 'base64');
    const file = {
      buffer,
      size: buffer.byteLength,
      mimetype: dto.mimeType,
      originalname: dto.filename,
    };
    return this.uploadsService.upload(file, dto, SYSTEM_ID);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.uploadsService.remove(id, SYSTEM_ID);
  }
}
