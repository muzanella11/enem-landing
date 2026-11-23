/** Hard caps per request, so one request can't exhaust the 96M container. */
export const MAX_ENTRIES = 1000;
export const MAX_RESPONSE_BYTES = 1024 * 1024;
export const MAX_LINE_CHARS = 8 * 1024;
/** How far back one request scans while searching before it returns. */
export const MAX_SCAN_BYTES = 32 * 1024 * 1024;
/** Decompressed size cap for `.gz` rotations. */
export const MAX_GZIP_BYTES = 50 * 1024 * 1024;
/** Raw lines kept from a `.gz` stream for one page. */
export const GZIP_WINDOW_BYTES = 4 * 1024 * 1024;
export const READ_CHUNK_BYTES = 64 * 1024;
export const REQUEST_TIMEOUT_MS = 10_000;
