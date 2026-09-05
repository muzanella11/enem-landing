import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSettingsModule } from '../system-settings/system-settings.module.js';
import { FileEntity } from './file.entity.js';
import { InternalUploadsController } from './internal-uploads.controller.js';
import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), SystemSettingsModule],
  controllers: [UploadsController, InternalUploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
