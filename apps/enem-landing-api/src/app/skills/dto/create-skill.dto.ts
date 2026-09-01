import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
