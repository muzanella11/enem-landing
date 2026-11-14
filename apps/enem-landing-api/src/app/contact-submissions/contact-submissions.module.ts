import { SchedulerModule } from '@enem-landing/backend-scheduler';
import { SsoModule } from '@enem-landing/backend-sso';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptchaModule } from '../captcha/captcha.module.js';
import { TrackingSessionEntity } from '../tracking/tracking-session.entity.js';
import { ContactSubmissionSenderEntity } from './contact-submission-sender.entity.js';
import { ContactSubmissionEntity } from './contact-submission.entity.js';
import { ContactSubmissionsController } from './contact-submissions.controller.js';
import { ContactSubmissionsService } from './contact-submissions.service.js';
import { ContactSenderEnrichmentService } from './sender/contact-sender-enrichment.service.js';
import { TorExitListService } from './sender/tor-exit-list.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContactSubmissionEntity,
      ContactSubmissionSenderEntity,
      TrackingSessionEntity,
    ]),
    SsoModule,
    SchedulerModule,
    CaptchaModule,
  ],
  controllers: [ContactSubmissionsController],
  providers: [
    ContactSubmissionsService,
    ContactSenderEnrichmentService,
    TorExitListService,
  ],
})
export class ContactSubmissionsModule {}
