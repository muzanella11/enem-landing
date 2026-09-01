import { Type } from 'class-transformer';
import { IsArray, IsString, IsUrl, ValidateNested } from 'class-validator';

class SocialLinkDto {
  @IsString()
  platform!: string;

  @IsUrl({ require_tld: false })
  url!: string;
}

export class UpdateSiteProfileDto {
  @IsString()
  heroTitle!: string;

  @IsString()
  heroSubtitle!: string;

  @IsString()
  bio!: string;

  @IsString()
  avatarUrl!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks!: SocialLinkDto[];
}
