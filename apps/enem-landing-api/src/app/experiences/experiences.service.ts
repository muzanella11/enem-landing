import { CacheService } from '@enem-landing/backend-cache';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_KEYS, CACHE_TTL_SECONDS } from '../cache/cache.constants.js';
import { CreateExperienceDto } from './dto/create-experience.dto.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateExperienceDto } from './dto/update-experience.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ExperienceEntity } from './experience.entity.js';
import { ProjectEntity } from './project.entity.js';

@Injectable()
export class ExperiencesService {
  constructor(
    @InjectRepository(ExperienceEntity)
    private readonly experiencesRepository: Repository<ExperienceEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectsRepository: Repository<ProjectEntity>,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(): Promise<ExperienceEntity[]> {
    const cached = await this.cacheService.getCached<ExperienceEntity[]>(
      CACHE_KEYS.PUBLIC_EXPERIENCES,
    );
    if (cached) return cached;

    const experiences = await this.experiencesRepository.find({
      relations: ['projects'],
      order: { createdAt: 'ASC' },
    });
    await this.cacheService.setCached(
      CACHE_KEYS.PUBLIC_EXPERIENCES,
      experiences,
      CACHE_TTL_SECONDS[CACHE_KEYS.PUBLIC_EXPERIENCES],
    );
    return experiences;
  }

  async findOne(id: string): Promise<ExperienceEntity> {
    const experience = await this.experiencesRepository.findOne({
      where: { id },
      relations: ['projects'],
    });
    if (!experience) {
      throw new NotFoundException('Experience not found');
    }
    return experience;
  }

  async create(dto: CreateExperienceDto): Promise<ExperienceEntity> {
    const experience = this.experiencesRepository.create(dto);
    const saved = await this.experiencesRepository.save(experience);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
    return saved;
  }

  async update(
    id: string,
    dto: UpdateExperienceDto,
  ): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    Object.assign(experience, dto);
    const saved = await this.experiencesRepository.save(experience);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const experience = await this.findOne(id);
    await this.experiencesRepository.remove(experience);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
  }

  private async findExperienceOrThrow(
    experienceId: string,
  ): Promise<ExperienceEntity> {
    const experience = await this.experiencesRepository.findOne({
      where: { id: experienceId },
    });
    if (!experience) {
      throw new NotFoundException('Experience not found');
    }
    return experience;
  }

  private async findProjectOrThrow(projectId: string): Promise<ProjectEntity> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async createProject(
    experienceId: string,
    dto: CreateProjectDto,
  ): Promise<ProjectEntity> {
    await this.findExperienceOrThrow(experienceId);
    const project = this.projectsRepository.create({ ...dto, experienceId });
    const saved = await this.projectsRepository.save(project);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
    return saved;
  }

  async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<ProjectEntity> {
    const project = await this.findProjectOrThrow(projectId);
    Object.assign(project, dto);
    const saved = await this.projectsRepository.save(project);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
    return saved;
  }

  async removeProject(projectId: string): Promise<void> {
    const project = await this.findProjectOrThrow(projectId);
    await this.projectsRepository.remove(project);
    await this.cacheService.invalidate(CACHE_KEYS.PUBLIC_EXPERIENCES);
  }
}
