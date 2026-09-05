import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const DEVICE_BUCKETS = ['mobile', 'tablet', 'desktop'] as const;

export class GetHeatmapQueryDto {
  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsIn(DEVICE_BUCKETS)
  device!: (typeof DEVICE_BUCKETS)[number];
}
