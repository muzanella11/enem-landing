import { Role } from '@enem-landing/shared-definitions';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertAdminRole } from './assert-admin-role.js';

const buildUser = (role: Role) => ({ id: '1', fullname: 'A', email: 'a@example.com', role });

describe('assertAdminRole', () => {
  it('allows ADMIN', () => {
    expect(() => assertAdminRole(buildUser(Role.Admin))).not.toThrow();
  });

  it('allows SUPER_ADMIN', () => {
    expect(() => assertAdminRole(buildUser(Role.SuperAdmin))).not.toThrow();
  });

  it('rejects USER', () => {
    expect(() => assertAdminRole(buildUser(Role.User))).toThrow(ForbiddenException);
  });
});
