import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import type { SeederOptions } from 'typeorm-extension';
import { config } from './typeorm.config.js';
import UsersAddSuperAdmin from './seeds/users-add-super-admin.seed.js';
import UsersAddUser from './seeds/users-add-user.seed.js';

const seederConfig: DataSourceOptions & SeederOptions = {
  ...config,
  seeds: [UsersAddSuperAdmin, UsersAddUser],
};

const dataSource = new DataSource(seederConfig);

dataSource.initialize().then(async () => {
  await runSeeders(dataSource);
  console.log('Seeding complete.');
  await dataSource.destroy();
  process.exit(0);
});
