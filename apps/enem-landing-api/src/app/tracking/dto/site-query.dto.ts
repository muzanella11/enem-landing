import {
  TRACKING_SITES,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import { IsIn, IsOptional } from 'class-validator';

/** `?site=` filter for the CMS-facing tracking endpoints - defaults to `landing` when omitted. */
export class SiteQueryDto {
  @IsOptional()
  @IsIn(TRACKING_SITES)
  site?: TrackingSite;
}
