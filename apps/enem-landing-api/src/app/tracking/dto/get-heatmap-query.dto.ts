import {
  TRACKING_SITES,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const DEVICE_BUCKETS = ['mobile', 'tablet', 'desktop'] as const;

export class GetHeatmapQueryDto {
  /** Which site sent this - set by that site's BFF, defaults to `landing` (Story 25). */
  @IsOptional()
  @IsIn(TRACKING_SITES)
  site?: TrackingSite;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsIn(DEVICE_BUCKETS)
  device!: (typeof DEVICE_BUCKETS)[number];
}
