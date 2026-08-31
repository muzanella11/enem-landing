import { IsNotEmpty, IsString, IsUrl, IsOptional, Matches } from 'class-validator';

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

  @IsOptional()
  @IsUrl({ require_tld: false })
  ogImageUrl?: string;
}
