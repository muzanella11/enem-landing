import {
  TRACKING_SITES,
  type TrackingSite,
} from '@enem-landing/shared-definitions';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const DEVICE_BUCKETS = ['mobile', 'tablet', 'desktop'] as const;

export class CreateClickItemDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  xPct!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  yPct!: number;

  @IsIn(DEVICE_BUCKETS)
  deviceBucket!: (typeof DEVICE_BUCKETS)[number];

  @IsISO8601()
  occurredAt!: string;
}

export class CreateClickBatchDto {
  /** Which site sent this - set by that site's BFF, defaults to `landing` (Story 25). */
  @IsOptional()
  @IsIn(TRACKING_SITES)
  site?: TrackingSite;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClickItemDto)
  items!: CreateClickItemDto[];
}
