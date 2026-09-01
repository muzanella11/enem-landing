import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  create(
    data: Pick<UserEntity, 'email' | 'passwordHash' | 'role' | 'fullname'>,
  ): Promise<UserEntity> {
    return this.usersRepository.save(this.usersRepository.create(data));
  }

  async upsertByEmail(
    data: Pick<UserEntity, 'email' | 'passwordHash' | 'role' | 'fullname'>,
  ): Promise<UserEntity> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      return this.usersRepository.save({ ...existing, ...data });
    }
    return this.create(data);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }
}
