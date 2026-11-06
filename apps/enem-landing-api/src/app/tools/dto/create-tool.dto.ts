import {
  TOOL_BADGES,
  TOOL_CATEGORIES,
  type ToolBadge,
  type ToolCategory,
} from '@enem-landing/shared-definitions';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateToolDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be kebab-case',
  })
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  shortDescription!: string;

  @IsIn(TOOL_CATEGORIES)
  category!: ToolCategory;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(TOOL_BADGES)
  badge?: ToolBadge | null;

  @IsOptional()
  @IsBoolean()
  adsEnabled?: boolean;
}
