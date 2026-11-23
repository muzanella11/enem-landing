import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller.js';

@Module({
  controllers: [OverviewController],
})
export class OverviewModule {}
