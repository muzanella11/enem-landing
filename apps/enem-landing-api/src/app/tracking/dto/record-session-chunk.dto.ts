import { IsArray, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class RecordSessionChunkDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsInt()
  @Min(0)
  sequence!: number;

  /** Raw rrweb events for this chunk - validated as a non-empty array, contents are opaque and gzipped as-is before upload. */
  @IsArray()
  events!: unknown[];
}
