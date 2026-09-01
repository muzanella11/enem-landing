import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateProjectDto } from './create-project.dto.js';

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsNotEmpty()
  position!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  roleSummary!: string;

  @IsString()
  @IsNotEmpty()
  workingPeriode!: string;

  @IsArray()
  @IsString({ each: true })
  experienceGained!: string[];

  /** Optional — the CMS creates an experience first, then adds projects one at a time via `POST /experiences/:id/projects`. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDto)
  projects?: CreateProjectDto[];
}
