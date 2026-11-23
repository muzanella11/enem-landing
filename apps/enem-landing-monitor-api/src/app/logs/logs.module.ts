import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller.js';

/** LogReaderClient comes from the global CoreModule. */
@Module({
  controllers: [LogsController],
})
export class LogsModule {}
