import { RedisModule } from '@enem-landing/backend-redis';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { SystemSettingEntity } from './system-settings/system-setting.entity.js';
import { SystemSettingsModule } from './system-settings/system-settings.module.js';
import { FileEntity } from './uploads/file.entity.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UserEntity } from './users/user.entity.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env['DATABASE_URL'],
      entities: [UserEntity, FileEntity, SystemSettingEntity],
      synchronize: false,
    }),
    RedisModule,
    UsersModule,
    AuthModule,
    HealthModule,
    SystemSettingsModule,
    UploadsModule,
  ],
})
export class AppModule {}
