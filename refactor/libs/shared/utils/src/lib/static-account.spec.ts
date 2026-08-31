import { Role } from '@enem-landing/shared-definitions';
import { describe, expect, it } from 'vitest';
import { StaticAccount, StaticAccountSystem } from './static-account.js';

describe('StaticAccount', () => {
  it('has fixtures for SuperAdmin, User, and System', () => {
    expect(StaticAccount[Role.SuperAdmin].email).toBe('superadmin@enem-landing.local');
    expect(StaticAccount[Role.User].email).toBe('user@enem-landing.local');
    expect(StaticAccount[StaticAccountSystem].email).toBe('system@enem-landing.local');
  });

  it('has no fixture for the Admin role', () => {
    expect((StaticAccount as Record<string, unknown>)[Role.Admin]).toBeUndefined();
  });
});
