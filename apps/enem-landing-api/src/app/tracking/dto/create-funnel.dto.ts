import {
  TRACKING_SITES,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFunnelDto {
  /** Which site sent this - set by that site's BFF, defaults to `landing` (Story 25). */
  @IsOptional()
  @IsIn(TRACKING_SITES)
  site?: TrackingSite;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  steps!: string[];
}
