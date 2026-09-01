export const jwtSecret = process.env['JWT_SECRET'] || 'change-me-in-production';

/** Default: 2 days, in seconds — used for both JWT expiry and the Redis session TTL. */
export const jwtExpiresInSeconds = parseInt(
  process.env['JWT_EXPIRES_IN_SECONDS'] || '172800',
  10,
);

/**
 * `/auth/signup` exists for structural parity with mau-account-api, but is
 * disabled by default — the admin account is provisioned by the Story 03
 * seed script, not through a public endpoint. See Story 03 in
 * `issues/03-enem-landing-account-api.md`.
 */
export const allowSignup = process.env['ALLOW_SIGNUP'] === 'true';
