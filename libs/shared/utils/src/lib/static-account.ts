import { Role } from '@enem-landing/shared-definitions';

/**
 * Ported from mau-apps (`libs/shared/utils/src/lib/static-account.ts`) —
 * fixed dev/staging seed accounts, used by the `enem-landing-account-api` seeders
 * (Story 03) and by service-to-service calls that need to act as a system
 * actor (`StaticAccountSystem`, mirrors `SsoService.loginAsSystem()` in
 * mau-apps' `libs/backend/sso`).
 *
 * These are dev/staging fixtures, not production credentials — mau-apps
 * commits the same plaintext placeholder password for the same reason
 * (seed data only, never exposed through a public endpoint). Rotate the
 * super-admin password via `POST /auth/change-password` immediately after
 * seeding a real environment.
 *
 * Unlike mau-apps, entries here don't carry a separate `username` field —
 * `enem-landing-account-api`'s `UserEntity` only has `email` as the login
 * identifier (see Story 03), so a `username` fixture field would be dead
 * data.
 *
 * No `StaticAccount[Role.Admin]` entry, matching mau-apps: `Admin`-role
 * users are created through normal account management (by a super admin),
 * not seeded as a fixture.
 */
export const StaticAccountSystem = 'SYSTEM';

export const StaticAccount = {
  [Role.SuperAdmin]: {
    fullname: 'Super Admin',
    email: 'superadmin@muzanella.com',
    password: 'letmeinfortesting',
  },
  [Role.User]: {
    fullname: 'User',
    email: 'user@muzanella.com',
    password: 'letmeinfortesting',
  },
  [StaticAccountSystem]: {
    fullname: 'System',
    email: 'system@muzanella.com',
    password: 'letmeinfortesting',
  },
} as const;
