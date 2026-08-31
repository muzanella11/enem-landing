import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard.js';
import type { AuthJwtPayload } from '../auth/auth-jwt-payload.js';
import { UploadFileDto } from './dto/upload-file.dto.js';
import { UPLOAD_HARD_CEILING_BYTES } from './uploads.constants.js';
import { UploadsService } from './uploads.service.js';

@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: UPLOAD_HARD_CEILING_BYTES },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
    @Request() req: ExpressRequest,
  ) {
    const { id: uploaderId } = req.user as AuthJwtPayload;
    return this.uploadsService.upload(file, dto, uploaderId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @Request() req: ExpressRequest) {
    const { id: requesterId } = req.user as AuthJwtPayload;
    return this.uploadsService.remove(id, requesterId);
  }
}
