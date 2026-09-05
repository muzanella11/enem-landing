import { IsInt, Min } from 'class-validator';

export class RecordPageviewDurationDto {
  @IsInt()
  @Min(0)
  durationMs!: number;
}
