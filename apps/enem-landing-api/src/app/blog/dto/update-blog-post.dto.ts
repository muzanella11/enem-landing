import { PartialType } from '@nestjs/mapped-types';
import { CreateBlogPostDto } from './create-blog-post.dto.js';

export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}
