import { ArrayMinSize, IsArray, IsString } from 'class-validator';

/** Tool ids in their new display order - index becomes `sortOrder`. */
export class ReorderToolsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[];
}
