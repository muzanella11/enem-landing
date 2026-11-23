import { Role } from '@enem-landing/shared-definitions';
import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { assertAdminRole, assertSuperAdminRole } from './assert-role.js';

const buildUser = (role: Role) => ({
  id: '1',
  fullname: 'A',
  email: 'a@example.com',
  role,
});

describe('assertAdminRole', () => {
  it('allows ADMIN', () => {
    expect(() => assertAdminRole(buildUser(Role.Admin))).not.toThrow();
  });

  it('allows SUPER_ADMIN', () => {
    expect(() => assertAdminRole(buildUser(Role.SuperAdmin))).not.toThrow();
  });

  it('rejects USER', () => {
    expect(() => assertAdminRole(buildUser(Role.User))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a missing user', () => {
    expect(() => assertAdminRole(undefined)).toThrow(ForbiddenException);
  });
});

describe('assertSuperAdminRole', () => {
  it('allows SUPER_ADMIN', () => {
    expect(() =>
      assertSuperAdminRole(buildUser(Role.SuperAdmin)),
    ).not.toThrow();
  });

  it('rejects ADMIN', () => {
    expect(() => assertSuperAdminRole(buildUser(Role.Admin))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects USER', () => {
    expect(() => assertSuperAdminRole(buildUser(Role.User))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a missing user', () => {
    expect(() => assertSuperAdminRole(undefined)).toThrow(ForbiddenException);
  });
});
