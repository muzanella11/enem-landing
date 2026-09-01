import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @IsString({ each: true })
  image!: string[];

  /**
   * Empty string is valid — matches `static/experience.json`, where
   * internal-only projects have no public link (see `pages/index.vue`'s
   * "Internal app, no preview link available" fallback in the current
   * live site).
   */
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  @IsNotEmpty()
  year!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  technologies!: string[];
}
