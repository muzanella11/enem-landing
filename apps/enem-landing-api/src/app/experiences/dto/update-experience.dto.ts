import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateExperienceDto } from './create-experience.dto.js';

/**
 * Excludes `projects` — nested projects are managed via their own
 * `/experiences/:id/projects` endpoints, not through this route, so an
 * experience update can never accidentally wipe or desync its projects.
 */
export class UpdateExperienceDto extends PartialType(
  OmitType(CreateExperienceDto, ['projects'] as const),
) {}
