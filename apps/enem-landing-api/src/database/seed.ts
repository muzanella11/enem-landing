import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { runSeeders } from 'typeorm-extension';
import type { SeederOptions } from 'typeorm-extension';
import { config } from './typeorm.config.js';
import ExperiencesSeed from './seeds/experiences.seed.js';
import SiteProfileSeed from './seeds/site-profile.seed.js';

const seederConfig: DataSourceOptions & SeederOptions = {
  ...config,
  seeds: [ExperiencesSeed, SiteProfileSeed],
};

const dataSource = new DataSource(seederConfig);

dataSource.initialize().then(async () => {
  await runSeeders(dataSource);
  console.log('Seeding complete.');
  await dataSource.destroy();
  process.exit(0);
});
