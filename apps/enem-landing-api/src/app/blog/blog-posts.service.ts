import { slugify } from '@enem-landing/shared-utils';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { BlogCategoryEntity } from './blog-category.entity.js';
import { BlogPostEntity } from './blog-post.entity.js';
import { BlogTagEntity } from './blog-tag.entity.js';
import { BlogPostsQueryDto } from './dto/blog-posts-query.dto.js';
import { CreateBlogPostDto } from './dto/create-blog-post.dto.js';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto.js';

const DEFAULT_PAGE_SIZE = 10;
const RELATED_POSTS_LIMIT = 3;
const EMPTY_DELTA = { ops: [] };
// Keeps generated slugs readable in a URL/search snippet - not a hard
// technical limit, a common SEO-friendliness guideline (Google itself
// doesn't penalize longer URLs, but a shorter, word-boundary-truncated
// slug reads better and avoids near-duplicate long slugs for similar
// titles).
const MAX_SLUG_LENGTH = 80;

export interface PaginatedBlogPosts {
  items: BlogPostEntity[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly repository: Repository<BlogPostEntity>,
    @InjectRepository(BlogCategoryEntity)
    private readonly categoryRepository: Repository<BlogCategoryEntity>,
    @InjectRepository(BlogTagEntity)
    private readonly tagRepository: Repository<BlogTagEntity>,
  ) {}

  async findPublished(query: BlogPostsQueryDto): Promise<PaginatedBlogPosts> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

    // Filtering by category/tag slug needs its own query builder per call
    // (not one reused instance with `leftJoinAndSelect`) - joining the
    // filter condition on the same alias used to eagerly load
    // `categories`/`tags` would silently drop every OTHER category/tag a
    // matched post has, since the join condition restricts which rows the
    // select pulls back too. Two lightweight queries (count, then a page
    // of ids) plus one relations-loaded `find` avoids that entirely.
    const buildFilteredQuery = () => {
      const qb = this.repository
        .createQueryBuilder('post')
        .where('post.status = :status', { status: 'published' });
      if (query.category) {
        qb.innerJoin(
          'post.categories',
          'filterCategory',
          'filterCategory.slug = :categorySlug',
          { categorySlug: query.category },
        );
      }
      if (query.tag) {
        qb.innerJoin('post.tags', 'filterTag', 'filterTag.slug = :tagSlug', {
          tagSlug: query.tag,
        });
      }
      return qb;
    };

    const total = await buildFilteredQuery().getCount();

    const idRows = await buildFilteredQuery()
      .select('post.id', 'id')
      .orderBy('post.publishedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getRawMany<{ id: string }>();

    if (idRows.length === 0) {
      return { items: [], total, page, pageSize };
    }

    const items = await this.repository.find({
      where: { id: In(idRows.map((row) => row.id)) },
      relations: ['categories', 'tags'],
      order: { publishedAt: 'DESC' },
    });

    return { items, total, page, pageSize };
  }

  async findBySlug(slug: string): Promise<BlogPostEntity> {
    const post = await this.repository.findOne({
      where: { slug, status: 'published' },
      relations: ['categories', 'tags'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async findRelatedBySlug(
    slug: string,
    limit = RELATED_POSTS_LIMIT,
  ): Promise<BlogPostEntity[]> {
    const post = await this.findBySlug(slug);
    const categoryIds = post.categories.map((category) => category.id);
    const tagIds = post.tags.map((tag) => tag.id);
    if (categoryIds.length === 0 && tagIds.length === 0) {
      return [];
    }

    const relatedIdRows = await this.repository
      .createQueryBuilder('post')
      .leftJoin('post.categories', 'relatedCategory')
      .leftJoin('post.tags', 'relatedTag')
      .select('post.id', 'id')
      // MySQL rejects `SELECT DISTINCT ... ORDER BY publishedAt` when
      // `publishedAt` isn't itself in the SELECT list - has to be added
      // explicitly here even though only `id` is read back below.
      .addSelect('post.publishedAt', 'publishedAt')
      .where('post.status = :status', { status: 'published' })
      .andWhere('post.id != :selfId', { selfId: post.id })
      .andWhere(
        new Brackets((sub) => {
          if (categoryIds.length > 0) {
            sub.orWhere('relatedCategory.id IN (:...categoryIds)', {
              categoryIds,
            });
          }
          if (tagIds.length > 0) {
            sub.orWhere('relatedTag.id IN (:...tagIds)', { tagIds });
          }
        }),
      )
      .distinct(true)
      .orderBy('post.publishedAt', 'DESC')
      .take(limit)
      .getRawMany<{ id: string }>();

    if (relatedIdRows.length === 0) {
      return [];
    }

    return this.repository.find({
      where: { id: In(relatedIdRows.map((row) => row.id)) },
      relations: ['categories', 'tags'],
      order: { publishedAt: 'DESC' },
    });
  }

  findAllForAdmin(): Promise<BlogPostEntity[]> {
    return this.repository.find({
      relations: ['categories', 'tags'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findOneForAdmin(id: string): Promise<BlogPostEntity> {
    const post = await this.repository.findOne({
      where: { id },
      relations: ['categories', 'tags'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPostEntity> {
    const slug = await this.resolveUniqueSlug(dto.title);
    const status = dto.status ?? 'draft';
    const post = this.repository.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt ?? null,
      contentDelta: dto.contentDelta ?? EMPTY_DELTA,
      coverImageUrl: dto.coverImageUrl ?? null,
      status,
      publishedAt: status === 'published' ? new Date() : null,
      metaTitle: dto.metaTitle ?? '',
      metaDescription: dto.metaDescription ?? '',
      ogImageUrl: dto.ogImageUrl ?? '',
      categories: await this.loadCategories(dto.categoryIds),
      tags: await this.loadTags(dto.tagIds),
    });
    return this.repository.save(post);
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostEntity> {
    const post = await this.findOneForAdmin(id);

    if (dto.title !== undefined) post.title = dto.title;
    // Slug is fixed at creation and never touched again, on purpose - a
    // published post's URL must not shift under readers/search engines
    // just because the title got a later typo fix. There's no `slug`
    // field on `UpdateBlogPostDto` at all (see `CreateBlogPostDto`), so
    // this isn't a choice made per-request, it's structural.
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
    if (dto.contentDelta !== undefined) post.contentDelta = dto.contentDelta;
    if (dto.coverImageUrl !== undefined) {
      post.coverImageUrl = dto.coverImageUrl;
    }
    if (dto.metaTitle !== undefined) post.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) {
      post.metaDescription = dto.metaDescription;
    }
    if (dto.ogImageUrl !== undefined) post.ogImageUrl = dto.ogImageUrl;
    if (dto.categoryIds !== undefined) {
      post.categories = await this.loadCategories(dto.categoryIds);
    }
    if (dto.tagIds !== undefined) {
      post.tags = await this.loadTags(dto.tagIds);
    }
    if (dto.status !== undefined && dto.status !== post.status) {
      if (dto.status === 'published' && post.publishedAt === null) {
        post.publishedAt = new Date();
      }
      post.status = dto.status;
    }

    return this.repository.save(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOneForAdmin(id);
    await this.repository.remove(post);
  }

  private async resolveUniqueSlug(source: string): Promise<string> {
    const base = this.buildSeoSlug(source);
    let candidate = base;
    let suffix = 2;
    // Sequential on purpose - each check needs the previous candidate's
    // result, and collisions are rare (manual, infrequent authoring).
    while (await this.slugTaken(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  /**
   * `slugify` (shared with other resources, e.g. `seo_meta.pageKey`) only
   * lowercases/hyphenates - the length cap here is blog-specific SEO
   * policy, not something the shared util should impose on every caller.
   * Truncates on a hyphen boundary so a long title never gets cut
   * mid-word.
   */
  private buildSeoSlug(title: string): string {
    const slug = slugify(title);
    if (!slug) {
      throw new BadRequestException(
        'Title must contain at least one letter or number to generate a slug',
      );
    }
    if (slug.length <= MAX_SLUG_LENGTH) return slug;
    const truncated = slug.slice(0, MAX_SLUG_LENGTH);
    const lastHyphen = truncated.lastIndexOf('-');
    return lastHyphen > 0 ? truncated.slice(0, lastHyphen) : truncated;
  }

  private async slugTaken(slug: string): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { slug } });
    return !!existing;
  }

  private async loadCategories(ids?: string[]): Promise<BlogCategoryEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.categoryRepository.find({ where: { id: In(ids) } });
  }

  private async loadTags(ids?: string[]): Promise<BlogTagEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.tagRepository.find({ where: { id: In(ids) } });
  }
}
