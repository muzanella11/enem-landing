import { Role } from '@enem-landing/shared-definitions';
import { describe, expect, it } from 'vitest';
import { StaticAccount, StaticAccountSystem } from './static-account.js';

describe('StaticAccount', () => {
  it('has fixtures for SuperAdmin, User, and System', () => {
    expect(StaticAccount[Role.SuperAdmin].email).toBe('superadmin@muzanella.com');
    expect(StaticAccount[Role.User].email).toBe('user@muzanella.com');
    expect(StaticAccount[StaticAccountSystem].email).toBe('system@muzanella.com');
  });

  it('has no fixture for the Admin role', () => {
    expect((StaticAccount as Record<string, unknown>)[Role.Admin]).toBeUndefined();
  });
});
