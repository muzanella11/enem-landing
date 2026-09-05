import { CacheService } from '@enem-landing/backend-cache';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CACHE_TTL_SECONDS } from '../cache/cache.constants.js';
import { CreateSkillDto } from './dto/create-skill.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { SkillEntity } from './skill.entity.js';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly repository: Repository<SkillEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<SkillEntity[]> {
    const cached = await this.cacheService.getCached<SkillEntity[]>(
      CACHE_KEYS.PUBLIC_SKILLS,
    );
    if (cached) return cached;

    const skills = await this.repository.find({
      order: { category: 'ASC', name: 'ASC' },
    });
    await this.cacheService.setCached(
      CACHE_KEYS.PUBLIC_SKILLS,
      skills,
      CACHE_TTL_SECONDS[CACHE_KEYS.PUBLIC_SKILLS],
    );
    return skills;
  }

  async create(dto: CreateSkillDto): Promise<SkillEntity> {
    const saved = await this.repository.save(
      this.repository.create({
        ...dto,
        level: dto.level ?? null,
        icon: dto.icon ?? null,
      }),
    );
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_SKILLS);
    return saved;
  }

  async update(id: string, dto: UpdateSkillDto): Promise<SkillEntity> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    Object.assign(skill, dto);
    const saved = await this.repository.save(skill);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_SKILLS);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const skill = await this.repository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    await this.repository.remove(skill);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_SKILLS);
  }
}
