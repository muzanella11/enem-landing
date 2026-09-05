import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreatePageviewItemDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsISO8601()
  enteredAt!: string;
}

export class CreatePageviewBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePageviewItemDto)
  items!: CreatePageviewItemDto[];
}
