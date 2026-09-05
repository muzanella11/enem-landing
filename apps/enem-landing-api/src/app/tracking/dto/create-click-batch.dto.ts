import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClickItemDto)
  items!: CreateClickItemDto[];
}
