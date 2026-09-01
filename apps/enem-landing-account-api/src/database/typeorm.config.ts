import '../load-env.js';
import type { DataSourceOptions } from 'typeorm';
import { UserEntity } from '../app/users/user.entity.js';
import { FileEntity } from '../app/uploads/file.entity.js';
import { SystemSettingEntity } from '../app/system-settings/system-setting.entity.js';

/** Used by the TypeORM CLI (migrations) and the seed entrypoint below. */
export const config: DataSourceOptions = {
  type: 'mysql',
  url: process.env['DATABASE_URL'],
  entities: [UserEntity, FileEntity, SystemSettingEntity],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
};
