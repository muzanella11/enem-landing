import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateEventItemDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  payload?: unknown;

  @IsOptional()
  @IsString()
  path?: string;

  @IsISO8601()
  occurredAt!: string;
}

export class CreateEventBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventItemDto)
  items!: CreateEventItemDto[];
}
