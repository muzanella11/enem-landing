import type { Role } from '@enem-landing/shared-definitions';

/** Contract for `enem-landing-account-api`'s `POST /auth/whoami` response. */
export interface User {
  id: string;
  fullname: string;
  email: string;
  role: Role;
}
