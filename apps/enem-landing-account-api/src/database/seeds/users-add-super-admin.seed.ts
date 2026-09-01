import { Role } from '@enem-landing/shared-definitions';
import { StaticAccount, StaticAccountSystem } from '@enem-landing/shared-utils';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { UserEntity } from '../../app/users/user.entity.js';

const SALT_ROUNDS = 10;

/**
 * Ported from mau-apps
 * (`apps/mau-account-api/src/database/seeds/users-add-super-admin.seed.ts`)
 * — seeds the SuperAdmin and System `StaticAccount` fixtures. Idempotent:
 * updates the existing row (with a freshly hashed password) if the email
 * is already present, rather than failing on the unique constraint.
 */
export default class UsersAddSuperAdmin implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);
    const accounts = [
      StaticAccount[Role.SuperAdmin],
      StaticAccount[StaticAccountSystem],
    ];

    for (const account of accounts) {
      const passwordHash = await bcrypt.hash(account.password, SALT_ROUNDS);
      const existing = await repository.findOne({
        where: { email: account.email },
      });

      if (existing) {
        await repository.save({
          ...existing,
          fullname: account.fullname,
          passwordHash,
        });
        console.log(`SuperAdmin fixture ${account.email} updated`);
        continue;
      }

      await repository.save(
        repository.create({
          fullname: account.fullname,
          email: account.email,
          passwordHash,
          role: Role.SuperAdmin,
        }),
      );
      console.log(`SuperAdmin fixture ${account.email} created`);
    }
  }
}
