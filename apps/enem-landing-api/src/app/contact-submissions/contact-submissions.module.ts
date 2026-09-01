import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactSubmissionEntity } from './contact-submission.entity.js';
import { ContactSubmissionsController } from './contact-submissions.controller.js';
import { ContactSubmissionsService } from './contact-submissions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ContactSubmissionEntity]), SsoModule],
  controllers: [ContactSubmissionsController],
  providers: [ContactSubmissionsService],
})
export class ContactSubmissionsModule {}
