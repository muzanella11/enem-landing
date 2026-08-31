import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  app!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  purpose!: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsPositive()
  maxSize!: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((v: string) => v.trim()) : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allowedMime!: string[];
}
