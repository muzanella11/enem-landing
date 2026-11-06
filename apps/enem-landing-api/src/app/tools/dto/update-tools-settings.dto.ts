import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateToolsSettingsDto {
  @IsOptional()
  @IsBoolean()
  adsEnabled?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^ca-pub-\d{10,20}$/, {
    message: 'adsenseClientId must look like ca-pub-XXXXXXXXXXXXXXXX',
  })
  adsenseClientId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\d{6,20}$/, {
    message: 'adsenseSlotResult must be a numeric ad unit id',
  })
  adsenseSlotResult?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\d{6,20}$/, {
    message: 'adsenseSlotSidebar must be a numeric ad unit id',
  })
  adsenseSlotSidebar?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  donationCtaText?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  blockedCategoriesNote?: string | null;
}
