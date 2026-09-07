import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import type { BlogPostStatus } from '../blog-post.entity.js';

export class CreateBlogPostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  // No client-settable `slug` field on purpose - it's always derived from
  // `title` server-side (see `BlogPostsService.resolveUniqueSlug`) and
  // fixed at creation, never editable afterward. Keeps every slug
  // guaranteed well-formed/SEO-friendly instead of trusting free-text
  // input.

  @IsOptional()
  @IsString()
  excerpt?: string;

  /** Quill Delta (`{ ops: [...] }`) - validated as a plain object, not a strict schema, mirrors `simple-json`/`json` columns elsewhere in this app that aren't shape-validated beyond "is an object". */
  @IsOptional()
  @IsObject()
  contentDelta?: Record<string, unknown>;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_tld: false })
  coverImageUrl?: string | null;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: BlogPostStatus;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
