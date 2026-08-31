import type { Role } from '@enem-landing/shared-definitions';

export interface AuthJwtPayload {
  id: string;
  fullname: string;
  email: string;
  role: Role;
}
