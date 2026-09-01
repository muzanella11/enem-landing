import {
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';

export class UpsertSeoMetaDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'pageKey must be lowercase letters, numbers, and hyphens only',
  })
  pageKey!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  // `@IsOptional()` only skips undefined/null, not '' — the CMS form
  // submits an empty string for "no image yet", not undefined.
  @ValidateIf((_, value) => value !== '')
  @IsUrl({ require_tld: false })
  ogImageUrl?: string;
}
