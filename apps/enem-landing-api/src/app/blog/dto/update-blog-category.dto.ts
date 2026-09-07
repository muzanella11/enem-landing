import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogCategoryDto } from './create-blog-category.dto.js';

export class UpdateBlogCategoryDto extends PartialType(CreateBlogCategoryDto) {}
