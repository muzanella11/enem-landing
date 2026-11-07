import {
  DONATION_PLATFORMS,
  type DonationPlatform,
} from '@enem-landing/shared-definitions';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const HTTPS_ONLY = { protocols: ['https'], require_protocol: true };

export class CreateDonationOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label!: string;

  @IsIn(DONATION_PLATFORMS)
  platform!: DonationPlatform;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl(HTTPS_ONLY)
  url?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl(HTTPS_ONLY)
  qrisImageUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(255)
  note?: string | null;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
