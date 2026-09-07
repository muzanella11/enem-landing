/**
 * `enem-landing-account-api`'s `UploadsService.upload` keys each R2 object
 * as `{app}/{purpose}/{uploadId}.{ext}` and builds the public URL straight
 * from that key, so the upload's own id (needed for `DELETE
 * /uploads/:id`) is recoverable from the URL alone - saves storing it
 * alongside every persisted image URL just to support deletion.
 */
export const extractUploadId = (url: string): string | null => {
  const filename = url.split('/').pop();
  if (!filename) return null;
  return filename.split('.')[0] || null;
};
