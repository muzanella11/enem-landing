import { loadConfig, MIN_TOKEN_LENGTH } from './config.js';
import { createReaderServer } from './server.js';

const config = loadConfig();

if (config.tokens.length === 0) {
  console.warn(
    `[log-reader] no token of at least ${MIN_TOKEN_LENGTH} characters configured (LOG_READER_TOKENS_FILE / LOG_READER_TOKENS): every request except /health is rejected`,
  );
}

const server = createReaderServer(config);
server.requestTimeout = 30_000;
server.listen(config.port, () => {
  console.log(
    `[log-reader] listening on :${config.port} (${config.tokens.length} token(s))`,
  );
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
