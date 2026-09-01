import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillEntity } from './skill.entity.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
  ) {}

  findAll(): Promise<SkillEntity[]> {
    return this.repository.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  create(dto: CreateSkillDto): Promise<SkillEntity> {
    return this.repository.save(
      this.repository.create({
        ...dto,
        level: dto.level ?? null,
        icon: dto.icon ?? null,
      }),
    );
  }

  async update(id: string, dto: UpdateSkillDto): Promise<SkillEntity> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    Object.assign(skill, dto);
    return this.repository.save(skill);
  }

  async remove(id: string): Promise<void> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    await this.repository.remove(skill);
  }
}
