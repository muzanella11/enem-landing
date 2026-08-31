import { config as loadDotenv } from 'dotenv';

/**
 * Loads `.env.local` first (gitignored, real dev values), falling back to
 * `.env` if it isn't present. Must be the first import wherever
 * `process.env` is read at module-evaluation time (e.g.
 * `TypeOrmModule.forRoot()` in `app.module.ts`) — Nest's `ConfigModule`
 * populates `process.env` too late for statically-evaluated `forRoot()`
 * calls, since those run during import, before Nest bootstraps.
 */
loadDotenv({ path: ['.env.local', '.env'] });
