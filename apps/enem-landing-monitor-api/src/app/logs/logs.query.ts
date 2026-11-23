import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Query DTOs: same rules as the log-reader, so bad input fails early here. */
export class PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(99) file?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) before?: number;
  @IsOptional() @IsString() @MaxLength(200) q?: string;
}

export class ContainerPageQuery extends PageQuery {
  @IsOptional() @IsIn(['stdout', 'stderr']) stream?: 'stdout' | 'stderr';
}

export class JournalQuery {
  @IsOptional() @Matches(/^[A-Za-z0-9@._:\\-]{1,128}$/) unit?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(7) priority?: number;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)
  since?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)
  until?: string;
  @IsOptional() @Matches(/^[A-Za-z0-9=;_-]{1,512}$/) cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000) limit?: number;
  @IsOptional() @IsString() @MaxLength(200) q?: string;
}

export class SlowlogQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(128) limit?: number;
}

export const SOURCE_ID = /^[a-z0-9-]{1,40}$/;
export const CONTAINER_ID = /^[a-f0-9]{64}$/;

export const toQuery = (dto: object): Record<string, string | undefined> =>
  Object.fromEntries(
    Object.entries(dto).map(([key, value]) => [
      key,
      value === undefined ? undefined : String(value),
    ]),
  );
