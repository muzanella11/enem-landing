import { DataSource } from 'typeorm';
import { config } from './typeorm.config.js';

/** Entry point for the TypeORM CLI, e.g. `typeorm migration:run -d src/database/data-source.ts`. */
export default new DataSource(config);
