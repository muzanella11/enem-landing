import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_MIN_FILL_MS,
  sanitizeClientSignals,
} from '@enem-landing/shared-definitions';
import { randomUUID } from 'node:crypto';
import { createApiClient, handleApiError } from '../../utils/api-client.js';

/** Visitor headers the API records with a submission (when present). */
const FORWARDED_HEADERS = [
  'user-agent',
  'accept-language',
  'referer',
  'cf-ipcountry',
  'cf-ray',
  'cf-ipcity',
  'cf-region',
] as const;

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

/**
 * Same shape as a real stored submission, so a bot can't tell it was
 * dropped and learn to dodge the trap.
 */
const fakeSuccess = (body: Record<string, unknown>) => ({
  id: randomUUID(),
  fullname: asString(body['fullname']),
  email: asString(body['email']),
  phoneNumber: asString(body['phoneNumber']),
  message: asString(body['message']),
  readAt: null,
  isSpam: false,
  spamReason: null,
  createdAt: new Date().toISOString(),
});

export default defineEventHandler(async (event) => {
  const body = ((await readBody(event)) ?? {}) as Record<string, unknown>;
  const client = sanitizeClientSignals(body['client']);

  // Bot traps: the hidden honeypot field is filled in, or the form was sent
  // faster than a person can type (or without the form's own timing at
  // all, i.e. posted straight to this endpoint). Dropped silently.
  const honeypot = asString(body[CONTACT_HONEYPOT_FIELD]).trim();
  const fillDurationMs = client.fillDurationMs ?? 0;
  if (honeypot || fillDurationMs < CONTACT_MIN_FILL_MS) {
    return fakeSuccess(body);
  }

  const headers: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = getHeader(event, name);
    if (value) headers[name] = value;
  }

  try {
    return await createApiClient(event).post(
      '/contact-submissions',
      {
        fullname: body['fullname'],
        email: body['email'],
        phoneNumber: body['phoneNumber'],
        message: body['message'],
        ...(typeof body['captchaToken'] === 'string'
          ? { captchaToken: body['captchaToken'] }
          : {}),
        client,
      },
      { headers },
    );
  } catch (error) {
    return handleApiError(error);
  }
});
