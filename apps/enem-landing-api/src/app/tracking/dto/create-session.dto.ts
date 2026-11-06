import {
  TRACKING_SITES,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  /** Which site sent this - set by that site's BFF, defaults to `landing` (Story 25). */
  @IsOptional()
  @IsIn(TRACKING_SITES)
  site?: TrackingSite;

  @IsString()
  @IsNotEmpty()
  visitorId!: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;

  // Only the browser itself can report these accurately (screen size,
  // exact IANA timezone) - the server-side User-Agent/Accept-Language
  // parsing below is a fallback, not a substitute.
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  screenWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  screenHeight?: number;
}
