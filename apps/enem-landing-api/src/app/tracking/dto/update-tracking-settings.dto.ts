import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class UpdateTrackingSettingsDto {
  @IsBoolean()
  pageviewEnabled!: boolean;

  @IsBoolean()
  eventsEnabled!: boolean;

  @IsBoolean()
  heatmapEnabled!: boolean;

  @IsBoolean()
  sessionRecordingEnabled!: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  sessionRecordingSampleRatePct!: number;
}
