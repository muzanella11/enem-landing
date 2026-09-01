import { Role } from '@enem-landing/shared-definitions';
import { StaticAccount } from '@enem-landing/shared-utils';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { UserEntity } from '../../app/users/user.entity.js';

const SALT_ROUNDS = 10;

/**
 * Ported from mau-apps
 * (`apps/mau-account-api/src/database/seeds/users-add-user.seed.ts`) —
 * seeds the plain `User` `StaticAccount` fixture. Idempotent, same
 * update-or-create behaviour as the SuperAdmin seeder.
 */
export default class UsersAddUser implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);
    const account = StaticAccount[Role.User];
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
      console.log(`User fixture ${account.email} updated`);
      return;
    }

    await repository.save(
      repository.create({
        fullname: account.fullname,
        email: account.email,
        passwordHash,
        role: Role.User,
      }),
    );
    console.log(`User fixture ${account.email} created`);
  }
}
