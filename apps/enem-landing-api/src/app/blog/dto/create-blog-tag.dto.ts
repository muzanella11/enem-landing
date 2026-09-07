import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogTagDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** Optional — auto-generated from `name` when omitted, see `BlogTagsService.create`. */
  @IsOptional()
  @IsString()
  slug?: string;
}
