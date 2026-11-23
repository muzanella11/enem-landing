import { Module } from '@nestjs/common';
import { LogReaderClient } from './log-reader.client.js';
import { LogsController } from './logs.controller.js';

@Module({
  controllers: [LogsController],
  providers: [LogReaderClient],
})
export class LogsModule {}
