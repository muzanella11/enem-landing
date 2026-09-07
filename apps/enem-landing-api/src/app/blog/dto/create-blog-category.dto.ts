import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** Optional — auto-generated from `name` when omitted, see `BlogCategoriesService.create`. */
  @IsOptional()
  @IsString()
  slug?: string;
}
