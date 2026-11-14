import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateBy,
} from 'class-validator';
import { PUZZLE_WIDTH } from '../puzzle-renderer.js';

const isTrailPoint = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every((part) => typeof part === 'number' && Number.isFinite(part));

export class VerifyCaptchaDto {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(PUZZLE_WIDTH)
  x!: number;

  @IsInt()
  @Min(0)
  @Max(600_000)
  durationMs!: number;

  @IsArray()
  @ArrayMaxSize(600)
  @ValidateBy({
    name: 'trailPoints',
    validator: {
      validate: (value: unknown) =>
        Array.isArray(value) && value.every(isTrailPoint),
      defaultMessage: () => 'trail must be a list of [x, y, t] numbers',
    },
  })
  trail!: [number, number, number][];
}
