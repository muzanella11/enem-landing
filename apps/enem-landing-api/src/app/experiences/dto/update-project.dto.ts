import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto.js';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
