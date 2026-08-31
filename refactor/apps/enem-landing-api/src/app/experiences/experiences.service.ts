import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  findAll(): Promise<ExperienceEntity[]> {
    return this.experiencesRepository.find({
      relations: ['projects'],
      order: { createdAt: 'ASC' },
    });
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

  create(dto: CreateExperienceDto): Promise<ExperienceEntity> {
    const experience = this.experiencesRepository.create(dto);
    return this.experiencesRepository.save(experience);
  }

  async update(id: string, dto: UpdateExperienceDto): Promise<ExperienceEntity> {
    const experience = await this.findOne(id);
    Object.assign(experience, dto);
    return this.experiencesRepository.save(experience);
  }

  async remove(id: string): Promise<void> {
    const experience = await this.findOne(id);
    await this.experiencesRepository.remove(experience);
  }

  private async findExperienceOrThrow(experienceId: string): Promise<ExperienceEntity> {
    const experience = await this.experiencesRepository.findOne({ where: { id: experienceId } });
    if (!experience) {
      throw new NotFoundException('Experience not found');
    }
    return experience;
  }

  private async findProjectOrThrow(projectId: string): Promise<ProjectEntity> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async createProject(experienceId: string, dto: CreateProjectDto): Promise<ProjectEntity> {
    await this.findExperienceOrThrow(experienceId);
    const project = this.projectsRepository.create({ ...dto, experienceId });
    return this.projectsRepository.save(project);
  }

  async updateProject(projectId: string, dto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findProjectOrThrow(projectId);
    Object.assign(project, dto);
    return this.projectsRepository.save(project);
  }

  async removeProject(projectId: string): Promise<void> {
    const project = await this.findProjectOrThrow(projectId);
    await this.projectsRepository.remove(project);
  }
}
