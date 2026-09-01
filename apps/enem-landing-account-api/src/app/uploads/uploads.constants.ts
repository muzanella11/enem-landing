/** Safety net at the interceptor/multer level — the real limit is `dto.maxSize`. */
export const UPLOAD_HARD_CEILING_BYTES = 20 * 1024 * 1024;
