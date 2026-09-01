import { Role } from '@enem-landing/shared-definitions';
import type { User } from '@enem-landing/shared-types';
import { ForbiddenException } from '@nestjs/common';

/**
 * Explicit role check on top of `SsoAuthGuard` — a valid token alone isn't
 * enough to reach admin routes. Written so a future role addition doesn't
 * silently widen access (see Story 06 scope note).
 */
export const assertAdminRole = (user: User): void => {
  if (user.role !== Role.Admin && user.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Admin access required');
  }
};
