import { Role } from '@enem-landing/shared-definitions';
import type { User } from '@enem-landing/shared-types';
import { ForbiddenException } from '@nestjs/common';

/**
 * Explicit role checks on top of `SsoAuthGuard`: a valid token alone isn't
 * enough to reach admin routes. Each check lists the roles it allows, so a
 * future role addition never silently widens access.
 */
export const assertAdminRole = (user: User | undefined): void => {
  if (user?.role !== Role.Admin && user?.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Admin access required');
  }
};

/**
 * Stricter than `assertAdminRole`: only `SUPER_ADMIN` passes. Used by
 * `enem-landing-monitor-api`, whose endpoints expose server logs (IPs,
 * usernames, queries).
 */
export const assertSuperAdminRole = (user: User | undefined): void => {
  if (user?.role !== Role.SuperAdmin) {
    throw new ForbiddenException('Super admin access required');
  }
};
