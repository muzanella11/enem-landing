/** Safety net at the interceptor/multer level — the real limit is `dto.maxSize`. */
export const UPLOAD_HARD_CEILING_BYTES = 20 * 1024 * 1024;

/** Sentinel `uploaderId`/`requesterId` for calls that aren't a logged-in user - a server-to-server call (see `InternalApiGuard`) or an internal service action. Stored as `undefined` on the file row rather than this literal string. */
export const SYSTEM_ID = 'SYSTEM';
