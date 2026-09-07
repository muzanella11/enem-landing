import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogTagDto } from './create-blog-tag.dto.js';

export class UpdateBlogTagDto extends PartialType(CreateBlogTagDto) {}
