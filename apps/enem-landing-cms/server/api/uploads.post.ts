import { getAuthToken } from '../utils/api-client.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Forwards an image upload from a CMS form to enem-landing-account-api's
 * `POST /uploads` (R2-backed). Uses `$fetch`/native `FormData` rather than
 * the shared axios client from `api-client.ts` - that client defaults to a
 * JSON content type, which makes axios JSON-encode a `FormData` body
 * instead of sending it as multipart.
 */
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);
  const filePart = parts?.find((part) => part.name === 'file' && part.filename);
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'File is required' });
  }

  const purposePart = parts?.find((part) => part.name === 'purpose');
  const purpose = purposePart?.data.toString('utf-8') || 'general';

  const body = new FormData();
  body.append(
    'file',
    new Blob([filePart.data], {
      type: filePart.type || 'application/octet-stream',
    }),
    filePart.filename,
  );
  body.append('app', 'enem-landing-cms');
  body.append('purpose', purpose);
  body.append('maxSize', String(MAX_IMAGE_BYTES));
  body.append('allowedMime', ALLOWED_IMAGE_MIME.join(','));

  const config = useRuntimeConfig();
  const token = getAuthToken(event);

  try {
    return await $fetch(`${config.accountApiHost}/uploads`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body,
    });
  } catch (error) {
    const fetchError = error as {
      status?: number;
      data?: { message?: string };
    };
    throw createError({
      statusCode: fetchError.status || 500,
      statusMessage: fetchError.data?.message || 'Upload failed',
    });
  }
});
