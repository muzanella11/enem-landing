import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateFunnelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  steps!: string[];
}
